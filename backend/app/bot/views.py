import discord
from discord import ui
import datetime
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models import Ticket, TicketMessage, TicketAuditLog
from app.services.transcript import generate_html_transcript

class TicketModal(ui.Modal, title="Open Support Ticket"):
    def __init__(self, category: str):
        super().__init__()
        self.category = category

    subject = ui.TextInput(
        label="Subject",
        placeholder="Brief summary of your inquiry...",
        min_length=3,
        max_length=120,
        required=True
    )
    description = ui.TextInput(
        label="Description",
        style=discord.TextStyle.paragraph,
        placeholder="Please detail your issue or question...",
        min_length=10,
        max_length=2000,
        required=True
    )

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)
        guild = interaction.guild
        if not guild:
            await interaction.followup.send("Tickets can only be opened inside a Discord server.", ephemeral=True)
            return

        async with AsyncSessionLocal() as db:
            # Generate ticket number
            stmt_num = select(Ticket.ticket_number).where(Ticket.guild_id == str(guild.id)).order_by(Ticket.ticket_number.desc()).limit(1)
            res_num = await db.execute(stmt_num)
            curr_max = res_num.scalar() or 1000
            next_num = curr_max + 1

            ticket = Ticket(
                ticket_number=next_num,
                guild_id=str(guild.id),
                customer_id=str(interaction.user.id),
                customer_name=interaction.user.display_name,
                category=self.category,
                subject=str(self.subject.value),
                description=str(self.description.value),
                status="Open",
                priority="Normal",
                created_at=datetime.datetime.utcnow()
            )
            db.add(ticket)
            await db.commit()
            await db.refresh(ticket)

            # Create private thread or channel
            thread_name = f"ticket-{next_num}-{self.category.lower().replace(' ', '-')}"
            thread = None
            if isinstance(interaction.channel, (discord.TextChannel, discord.ForumChannel)):
                try:
                    thread = await interaction.channel.create_thread(
                        name=thread_name,
                        type=discord.ChannelType.private_thread,
                        auto_archive_duration=1440,
                        reason=f"SupportDesk Ticket #{next_num}"
                    )
                    await thread.add_user(interaction.user)
                except Exception:
                    # Fallback to public thread if private thread permission lacks
                    thread = await interaction.channel.create_thread(
                        name=thread_name,
                        type=discord.ChannelType.public_thread,
                        auto_archive_duration=1440,
                        reason=f"SupportDesk Ticket #{next_num}"
                    )

            if thread:
                ticket.channel_id = str(thread.id)
                await db.commit()

                # Add initial message
                db.add(TicketMessage(
                    ticket_id=ticket.id,
                    author_id=str(interaction.user.id),
                    author_name=interaction.user.display_name,
                    is_staff=False,
                    content=str(self.description.value),
                    timestamp=datetime.datetime.utcnow()
                ))
                await db.commit()

                # Post welcome card in the new ticket thread
                embed = discord.Embed(
                    title=f"Support Ticket #{ticket.ticket_number}",
                    description=f"**Subject:** {ticket.subject}\n**Category:** {ticket.category}\n**Customer:** {interaction.user.mention}",
                    color=discord.Color.blue()
                )
                embed.add_field(name="Issue Description", value=ticket.description, inline=False)
                embed.set_footer(text="A support representative will assist you shortly.")
                await thread.send(embed=embed, view=TicketControlView(ticket_id=ticket.id))

                await interaction.followup.send(
                    f"Your ticket #{ticket.ticket_number} has been created in {thread.mention}!",
                    ephemeral=True
                )
            else:
                await interaction.followup.send(
                    f"Ticket #{ticket.ticket_number} created in database, but channel provision failed.",
                    ephemeral=True
                )

class CategorySelect(ui.Select):
    def __init__(self):
        options = [
            discord.SelectOption(label="Billing", description="Payment, invoices, subscription charges", emoji="💳"),
            discord.SelectOption(label="Technical Issue", description="Bugs, outages, connectivity errors", emoji="⚙️"),
            discord.SelectOption(label="Purchase Question", description="Product tiers, licenses, enterprise sales", emoji="🛍️"),
            discord.SelectOption(label="Account Help", description="Permissions, 2FA, identity recovery", emoji="🔐"),
            discord.SelectOption(label="Other", description="General community questions & feedback", emoji="💬"),
        ]
        super().__init__(placeholder="Select a support category...", min_values=1, max_values=1, options=options)

    async def callback(self, interaction: discord.Interaction):
        category = self.values[0]
        await interaction.response.send_modal(TicketModal(category=category))

class SupportPanelView(ui.View):
    def __init__(self):
        super().__init__(timeout=None)
        self.add_item(CategorySelect())

class TicketControlView(ui.View):
    def __init__(self, ticket_id: int):
        super().__init__(timeout=None)
        self.ticket_id = ticket_id

    @ui.button(label="Claim Ticket", style=discord.ButtonStyle.primary, emoji="✋", custom_id="ticket_claim")
    async def claim_button(self, interaction: discord.Interaction, button: ui.Button):
        async with AsyncSessionLocal() as db:
            stmt = select(Ticket).where(Ticket.id == self.ticket_id)
            res = await db.execute(stmt)
            ticket = res.scalar_one_or_none()
            if not ticket:
                await interaction.response.send_message("Ticket not found.", ephemeral=True)
                return

            ticket.assigned_agent_id = str(interaction.user.id)
            ticket.assigned_agent_name = interaction.user.display_name
            if ticket.status == "Open":
                ticket.status = "In Progress"
            await db.commit()

            embed = discord.Embed(
                description=f"Ticket claimed by {interaction.user.mention}.",
                color=discord.Color.green()
            )
            await interaction.channel.send(embed=embed)
            button.disabled = True
            await interaction.response.edit_message(view=self)

    @ui.button(label="Close & Archive", style=discord.ButtonStyle.danger, emoji="🔒", custom_id="ticket_close")
    async def close_button(self, interaction: discord.Interaction, button: ui.Button):
        await interaction.response.defer()
        async with AsyncSessionLocal() as db:
            stmt = select(Ticket).where(Ticket.id == self.ticket_id)
            res = await db.execute(stmt)
            ticket = res.scalar_one_or_none()
            if not ticket:
                await interaction.followup.send("Ticket not found.", ephemeral=True)
                return

            now = datetime.datetime.utcnow()
            ticket.status = "Closed"
            ticket.closed_at = now
            if not ticket.resolved_at:
                ticket.resolved_at = now

            # Fetch messages & generate transcript
            stmt_m = select(TicketMessage).where(TicketMessage.ticket_id == ticket.id).order_by(TicketMessage.timestamp.asc())
            res_m = await db.execute(stmt_m)
            msgs = res_m.scalars().all()
            ticket.transcript_html = generate_html_transcript(ticket, msgs)
            await db.commit()

            embed = discord.Embed(
                title=f"Ticket #{ticket.ticket_number} Closed",
                description="This support ticket has been closed and an archival transcript generated.",
                color=discord.Color.dark_gray()
            )
            await interaction.channel.send(embed=embed, view=RatingPromptView(ticket_id=ticket.id))

            # Archive / lock the thread
            if isinstance(interaction.channel, discord.Thread):
                await interaction.channel.edit(locked=True, archived=True)

class RatingPromptView(ui.View):
    def __init__(self, ticket_id: int):
        super().__init__(timeout=None)
        self.ticket_id = ticket_id

    async def record_rating(self, interaction: discord.Interaction, rating: int):
        async with AsyncSessionLocal() as db:
            stmt = select(Ticket).where(Ticket.id == self.ticket_id)
            res = await db.execute(stmt)
            ticket = res.scalar_one_or_none()
            if ticket:
                ticket.rating = rating
                await db.commit()
        await interaction.response.send_message(
            f"Thank you for rating your support experience **{rating}/5 stars**! ⭐",
            ephemeral=True
        )

    @ui.button(label="1 ⭐", style=discord.ButtonStyle.secondary)
    async def r1(self, interaction: discord.Interaction, button: ui.Button):
        await self.record_rating(interaction, 1)

    @ui.button(label="2 ⭐", style=discord.ButtonStyle.secondary)
    async def r2(self, interaction: discord.Interaction, button: ui.Button):
        await self.record_rating(interaction, 2)

    @ui.button(label="3 ⭐", style=discord.ButtonStyle.secondary)
    async def r3(self, interaction: discord.Interaction, button: ui.Button):
        await self.record_rating(interaction, 3)

    @ui.button(label="4 ⭐", style=discord.ButtonStyle.secondary)
    async def r4(self, interaction: discord.Interaction, button: ui.Button):
        await self.record_rating(interaction, 4)

    @ui.button(label="5 ⭐", style=discord.ButtonStyle.success)
    async def r5(self, interaction: discord.Interaction, button: ui.Button):
        await self.record_rating(interaction, 5)
