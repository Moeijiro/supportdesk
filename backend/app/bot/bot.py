import discord
from discord import app_commands
from discord.ext import commands
import datetime
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models import Ticket, TicketMessage
from app.bot.views import SupportPanelView, TicketControlView

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"[SupportDesk Bot] Authenticated as {bot.user.name} ({bot.user.id})")
    try:
        synced = await bot.tree.sync()
        print(f"[SupportDesk Bot] Synced {len(synced)} slash commands.")
    except Exception as e:
        print(f"[SupportDesk Bot] Failed to sync slash commands: {e}")

@bot.event
async def on_message(message: discord.Message):
    if message.author.bot:
        return

    # Check if inside an active ticket thread/channel
    if isinstance(message.channel, (discord.Thread, discord.TextChannel)):
        async with AsyncSessionLocal() as db:
            stmt = select(Ticket).where(Ticket.channel_id == str(message.channel.id))
            res = await db.execute(stmt)
            ticket = res.scalar_one_or_none()
            if ticket and ticket.status != "Closed":
                # Check if message is from staff
                is_staff = False
                if message.guild:
                    member = message.guild.get_member(message.author.id)
                    if member and any("staff" in r.name.lower() or "support" in r.name.lower() or r.permissions.manage_channels for r in member.roles):
                        is_staff = True

                now = datetime.datetime.utcnow()
                if is_staff and not ticket.first_response_at:
                    ticket.first_response_at = now
                    ticket.status = "Waiting for Customer"
                elif not is_staff and ticket.status == "Waiting for Customer":
                    ticket.status = "Waiting for Staff"

                db.add(TicketMessage(
                    ticket_id=ticket.id,
                    author_id=str(message.author.id),
                    author_name=message.author.display_name,
                    is_staff=is_staff,
                    content=message.content,
                    timestamp=now
                ))
                await db.commit()

    await bot.process_commands(message)

@bot.tree.command(name="support", description="Deploy the SupportDesk Interactive Ticket Panel")
@app_commands.default_permissions(manage_guild=True)
async def cmd_support(interaction: discord.Interaction):
    embed = discord.Embed(
        title="🎫 Customer Support Desk",
        description=(
            "Need help with your account, billing, or technical issues?\n\n"
            "Select a category below to open a private, dedicated support ticket thread with our team."
        ),
        color=discord.Color.blue()
    )
    embed.add_field(name="Available Queues", value="• 💳 **Billing**\n• ⚙️ **Technical Issue**\n• 🛍️ **Purchase Question**\n• 🔐 **Account Help**\n• 💬 **Other**", inline=False)
    embed.set_footer(text="SupportDesk • Enterprise Discord CRM & Helpdesk")
    await interaction.channel.send(embed=embed, view=SupportPanelView())
    await interaction.response.send_message("Support Panel deployed successfully!", ephemeral=True)

@bot.tree.command(name="claim", description="Claim ownership of the current ticket")
async def cmd_claim(interaction: discord.Interaction):
    async with AsyncSessionLocal() as db:
        stmt = select(Ticket).where(Ticket.channel_id == str(interaction.channel.id))
        res = await db.execute(stmt)
        ticket = res.scalar_one_or_none()
        if not ticket:
            await interaction.response.send_message("This command can only be run inside an active ticket channel.", ephemeral=True)
            return

        ticket.assigned_agent_id = str(interaction.user.id)
        ticket.assigned_agent_name = interaction.user.display_name
        ticket.status = "In Progress"
        await db.commit()

        await interaction.response.send_message(f"✋ {interaction.user.mention} has claimed this ticket.")

@bot.tree.command(name="close", description="Close and archive this ticket")
async def cmd_close(interaction: discord.Interaction):
    async with AsyncSessionLocal() as db:
        stmt = select(Ticket).where(Ticket.channel_id == str(interaction.channel.id))
        res = await db.execute(stmt)
        ticket = res.scalar_one_or_none()
        if not ticket:
            await interaction.response.send_message("This command can only be run inside an active ticket channel.", ephemeral=True)
            return

        ticket.status = "Closed"
        ticket.closed_at = datetime.datetime.utcnow()
        await db.commit()

        await interaction.response.send_message("🔒 Ticket closed. Archiving thread...")
        if isinstance(interaction.channel, discord.Thread):
            await interaction.channel.edit(locked=True, archived=True)

@bot.tree.command(name="priority", description="Update the priority of this ticket")
@app_commands.describe(priority="Ticket priority rating")
@app_commands.choices(priority=[
    app_commands.Choice(name="Low", value="Low"),
    app_commands.Choice(name="Normal", value="Normal"),
    app_commands.Choice(name="High", value="High"),
    app_commands.Choice(name="Urgent", value="Urgent")
])
async def cmd_priority(interaction: discord.Interaction, priority: app_commands.Choice[str]):
    async with AsyncSessionLocal() as db:
        stmt = select(Ticket).where(Ticket.channel_id == str(interaction.channel.id))
        res = await db.execute(stmt)
        ticket = res.scalar_one_or_none()
        if not ticket:
            await interaction.response.send_message("This command can only be run inside an active ticket channel.", ephemeral=True)
            return

        ticket.priority = priority.value
        await db.commit()

        await interaction.response.send_message(f"Ticket priority set to **{priority.name}**.")
