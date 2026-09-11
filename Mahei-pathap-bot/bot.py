import os
import secrets
import string
import hashlib
from datetime import datetime, timezone
import json
import requests

import discord
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("DISCORD_TOKEN")
APPWRITE_ENDPOINT = os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1").rstrip("/")
APPWRITE_PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID")
APPWRITE_API_KEY = os.getenv("APPWRITE_API_KEY")
APPWRITE_DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID")
APPWRITE_DISCORD_LINK_REQUESTS_COLLECTION_ID = os.getenv("APPWRITE_DISCORD_LINK_REQUESTS_COLLECTION_ID")
APPWRITE_DISCORD_USERS_COLLECTION_ID = os.getenv("APPWRITE_DISCORD_USERS_COLLECTION_ID")
APPWRITE_USER_MONTHLY_STATS_TABLE_ID = os.getenv(
    "APPWRITE_USER_MONTHLY_STATS_TABLE_ID",
    "user_monthly_stats"
)
if not TOKEN:
    raise RuntimeError("DISCORD_TOKEN is missing from .env")



def appwrite_headers():
    return {
        "Content-Type": "application/json",
        "X-Appwrite-Project": APPWRITE_PROJECT_ID,
        "X-Appwrite-Key": APPWRITE_API_KEY,
    }


def appwrite_request(path, method="GET", **kwargs):
    response = requests.request(
        method,
        f"{APPWRITE_ENDPOINT}{path}",
        headers=appwrite_headers(),
        timeout=10,
        **kwargs,
    )
    data = response.json() if response.content else {}
    if not response.ok:
        raise RuntimeError(data.get("message") or f"Appwrite request failed ({response.status_code})")
    return data


def tablesdb_table_base(table_id):
    return (
        f"/tablesdb/{APPWRITE_DATABASE_ID}"
        f"/tables/{table_id}"
    )



def get_linked_mahei_user(discord_user_id):
    result = appwrite_request(
        f"{tablesdb_table_base(APPWRITE_DISCORD_USERS_COLLECTION_ID)}/rows",
        params={
            "limit": 100,
        },
    )

    rows = result.get("rows") or []

    for row in rows:
        if str(
            row.get("discord_user_id", "")
        ) == str(discord_user_id):
            return row

    return None




def hash_link_code(code):
    return hashlib.sha256(
        code.strip().upper().encode()
    ).hexdigest()


def appwrite_list_rows(table_id):
    """
    List rows from a TablesDB table without using
    Appwrite query filters.

    We intentionally do the matching in Python so
    we avoid the query/schema problems we were seeing.
    """
    rows = []
    offset = 0
    limit = 100

    while True:
        result = appwrite_request(
            f"{tablesdb_table_base(table_id)}/rows",
            params={
                "limit": limit,
                "offset": offset,
            },
        )

        batch = result.get("rows") or []
        rows.extend(batch)

        if not batch:
            break

        if len(batch) < limit:
            break

        offset += len(batch)

    return rows


def appwrite_create_row(table_id, data):
    return appwrite_request(
        f"{tablesdb_table_base(table_id)}/rows",
        method="POST",
        json={
            "rowId": "unique()",
            "data": data,
        },
    )


def get_user_monthly_stats(appwrite_user_id):
    rows = appwrite_list_rows(
        APPWRITE_USER_MONTHLY_STATS_TABLE_ID
    )

    user_rows = []

    for row in rows:
        if str(
            row.get("appwrite_user_id", "")
        ) == str(appwrite_user_id):
            user_rows.append(row)

    return user_rows



def get_user_monthly_stats(appwrite_user_id):
    rows = appwrite_list_rows(
        APPWRITE_USER_MONTHLY_STATS_TABLE_ID
    )

    user_rows = []

    for row in rows:
        if str(
            row.get("appwrite_user_id", "")
        ) == str(appwrite_user_id):
            user_rows.append(row)

    return user_rows


def calculate_user_progress(appwrite_user_id):
    rows = get_user_monthly_stats(appwrite_user_id)

    total_xp = 0
    total_focus_minutes = 0
    total_focus_sessions = 0

    for row in rows:
        total_xp += int(row.get("xp", 0) or 0)
        total_focus_minutes += int(
            row.get("focus_minutes", 0) or 0
        )
        total_focus_sessions += int(
            row.get("focus_sessions", 0) or 0
        )

    return {
        "total_xp": total_xp,
        "total_focus_minutes": total_focus_minutes,
        "total_focus_sessions": total_focus_sessions,
    }


def get_monthly_xp(appwrite_user_id, month_key):
    rows = get_user_monthly_stats(appwrite_user_id)

    for row in rows:
        if str(row.get("month_key", "")) == str(month_key):
            return int(row.get("xp", 0) or 0)

    return 0


def get_current_month_key():
    return datetime.now(timezone.utc).strftime("%Y-%m")




def appwrite_update_row(table_id, row_id, data):
    return appwrite_request(
        f"{tablesdb_table_base(table_id)}"
        f"/rows/{row_id}",
        method="PATCH",
        json={
            "data": data,
        },
    )


def appwrite_list_all_documents(collection_id):
    """
    Read all documents from a collection without using Appwrite queries.

    This intentionally avoids query syntax because the current
    Discord-linking collection is returning an Appwrite query-schema error.
    """
    documents = []
    offset = 0
    limit = 100

    while True:
        result = appwrite_request(
            f"/databases/{APPWRITE_DATABASE_ID}"
            f"/collections/{collection_id}"
            f"/documents",

            params={
                "limit": limit,
                "offset": offset,
            },
        )

        batch = result.get("documents") or []
        documents.extend(batch)

        total = int(result.get("total") or 0)

        if not batch:
            break

        offset += len(batch)

        if offset >= total:
            break

    return documents


def link_discord_account(code, discord_user):
    code_hash = hash_link_code(code)

    # =====================================================
    # FIND LINK REQUEST
    # =====================================================

    link_rows = appwrite_list_rows(
        APPWRITE_DISCORD_LINK_REQUESTS_COLLECTION_ID
    )

    request_row = None

    for row in link_rows:
        row_code_hash = row.get("codeHash")
        row_used = row.get("used")

        if (
            row_code_hash == code_hash
            and row_used is False
        ):
            request_row = row
            break

    if not request_row:
        raise RuntimeError(
            "Invalid or expired Discord link code."
        )

    # =====================================================
    # CHECK EXPIRATION
    # =====================================================

    expires_at = request_row.get(
        "expiresAt"
    )

    if not expires_at:
        raise RuntimeError(
            "This Discord link code is invalid."
        )

    try:
        expires = datetime.fromisoformat(
            expires_at.replace(
                "Z",
                "+00:00"
            )
        )
    except (ValueError, TypeError):
        raise RuntimeError(
            "This Discord link code is invalid."
        )

    if expires <= datetime.now(timezone.utc):
        raise RuntimeError(
            "This Discord link code has expired. Generate a new one on Mahei-Pathap."
        )

    # =====================================================
    # GET MAHEI USER ID
    # =====================================================

    user_id = request_row.get(
        "userId"
    )

    if not user_id:
        raise RuntimeError(
            "The Discord link request has no Mahei-Pathap user ID."
        )

    now = (
        datetime.now(timezone.utc)
        .isoformat()
        .replace(
            "+00:00",
            "Z"
        )
    )

    # =====================================================
    # FIND EXISTING DISCORD USER
    # =====================================================

    discord_rows = appwrite_list_rows(
        APPWRITE_DISCORD_USERS_COLLECTION_ID
    )

    existing_row = None

    for row in discord_rows:
        if (
            str(
                row.get(
                    "discord_user_id",
                    ""
                )
            )
            == str(discord_user.id)
        ):
            existing_row = row
            break

    # =====================================================
    # PREVENT LINKING TO ANOTHER MAHEI ACCOUNT
    # =====================================================

    if existing_row:
        existing_appwrite_user_id = (
            existing_row.get(
                "appwrite_user_id"
            )
        )

        if existing_appwrite_user_id not in (
            None,
            "",
            user_id,
        ):
            raise RuntimeError(
                "This Discord account is already linked to another Mahei-Pathap account."
            )

    # =====================================================
    # BUILD DISCORD USER DATA
    #
    # These names match your actual discord_users table:
    #
    # appwrite_user_id
    # discord_user_id
    # discord_username
    # linked_at
    # =====================================================

    payload = {
        "appwrite_user_id":
            str(user_id),

        "discord_user_id":
            str(discord_user.id),

        "discord_username":
            str(discord_user),

        "linked_at":
            now,
    }

    # =====================================================
    # CREATE OR UPDATE DISCORD USER ROW
    # =====================================================

    if existing_row:
        appwrite_update_row(
            APPWRITE_DISCORD_USERS_COLLECTION_ID,
            existing_row["$id"],
            payload,
        )

    else:
        appwrite_create_row(
            APPWRITE_DISCORD_USERS_COLLECTION_ID,
            payload,
        )

    # =====================================================
    # MARK LINK REQUEST AS USED
    # =====================================================

    appwrite_update_row(
        APPWRITE_DISCORD_LINK_REQUESTS_COLLECTION_ID,
        request_row["$id"],
        {
            "used": True,
        },
    )

    return user_id
# =========================
# INTENTS
# =========================

intents = discord.Intents.default()
intents.members = True
intents.message_content = True
intents.voice_states = True


# =========================
# BOT
# =========================

bot = commands.Bot(
    command_prefix="!",
    intents=intents
)


# =========================
# SETTINGS
# =========================

STUDY_LOUNGE = "study-lounge"
STUDY_CATEGORY = "STUDY ROOMS"

# 0 = unlimited
DEFAULT_ROOM_LIMIT = 0

# Discord voice channel maximum
MAX_ROOM_LIMIT = 99


# =========================
# STORAGE
# =========================

# owner_id -> room_id
study_rooms = {}

# room_id -> owner_id
room_owners = {}

# room_code -> room_id
room_codes = {}

# room_id -> user limit
# 0 = unlimited
room_limits = {}


# =========================
# GENERATE ROOM CODE
# =========================

def generate_room_code():
    characters = string.ascii_uppercase + string.digits

    while True:
        code = "MP-" + "".join(
            secrets.choice(characters)
            for _ in range(4)
        )

        if code not in room_codes:
            return code


# =========================
# GET ROOM LIMIT TEXT
# =========================

def get_limit_text(room_id):
    limit = room_limits.get(
        room_id,
        DEFAULT_ROOM_LIMIT
    )

    if limit == 0:
        return "♾️ Unlimited"

    return f"{limit} students"


# =========================
# BOT READY
# =========================

@bot.event
async def on_ready():

    synced = await bot.tree.sync()

    print(f"Logged in as {bot.user}")
    print("Mahei Pathap Study Room system is online! 📚")
    print(f"Synced {len(synced)} slash commands:")

    for command in synced:
        print(f"  /{command.name}")


# =========================
# VOICE STATE
# =========================

@bot.event
async def on_voice_state_update(
    member,
    before,
    after
):

    # =========================
    # CREATE STUDY ROOM
    # =========================

    if (
        after.channel
        and after.channel.name == STUDY_LOUNGE
    ):

        guild = member.guild

        category = discord.utils.get(
            guild.categories,
            name=STUDY_CATEGORY
        )

        if category is None:

            print(
                f"Category not found: "
                f"{STUDY_CATEGORY}"
            )

            return

        # -------------------------
        # ALREADY OWNS A ROOM
        # -------------------------

        if member.id in study_rooms:

            room = guild.get_channel(
                study_rooms[member.id]
            )

            if room:

                try:

                    await member.move_to(room)

                except discord.Forbidden:

                    print(
                        "❌ Bot cannot move member. "
                        "Check Move Members permission."
                    )

                return

            else:

                # Stored room no longer exists
                del study_rooms[member.id]

        # =========================
        # ROOM PERMISSIONS
        # =========================

        overwrites = {

            guild.default_role:
                discord.PermissionOverwrite(
                    view_channel=False,
                    connect=False
                ),

            member:
                discord.PermissionOverwrite(
                    view_channel=True,
                    connect=True,
                    speak=True,
                    stream=True
                ),

            guild.me:
                discord.PermissionOverwrite(
                    view_channel=True,
                    connect=True,
                    speak=True,
                    stream=True,
                    manage_channels=True,
                    move_members=True
                )
        }

        # =========================
        # CREATE ROOM
        # =========================

        try:

            room = await guild.create_voice_channel(

                name=(
                    f"🔒・{member.display_name}"
                    "'s Study Room"
                ),

                category=category,

                overwrites=overwrites,

                # 0 = unlimited
                user_limit=DEFAULT_ROOM_LIMIT,

                reason=(
                    "Temporary Mahei Pathap "
                    "study room"
                )
            )

        except discord.Forbidden:

            print(
                "❌ Bot cannot create the study room."
            )

            return

        # -------------------------
        # SAVE ROOM DATA
        # -------------------------

        study_rooms[member.id] = room.id
        room_owners[room.id] = member.id

        room_limits[room.id] = DEFAULT_ROOM_LIMIT

        print(
            f"Created study room for "
            f"{member.display_name}"
        )

        print(
            f"Room limit for {room.name}: "
            f"{get_limit_text(room.id)}"
        )

        # =========================
        # MOVE OWNER
        # =========================

        try:

            await member.move_to(room)

        except discord.Forbidden:

            print(
                "❌ Bot cannot move the member. "
                "Check Move Members permission."
            )


    # =========================
    # DELETE EMPTY ROOM
    # =========================

    if (
        before.channel
        and before.channel.category
    ):

        if (
            before.channel.category.name
            == STUDY_CATEGORY
        ):

            room = before.channel

            # Never delete Study Lounge
            if room.name == STUDY_LOUNGE:
                return

            # Delete only if empty
            if len(room.members) == 0:

                try:

                    room_name = room.name

                    await room.delete(
                        reason="Study room is empty"
                    )

                    # Owner
                    owner_id = room_owners.pop(
                        room.id,
                        None
                    )

                    # Owner -> room
                    if owner_id is not None:

                        if (
                            study_rooms.get(owner_id)
                            == room.id
                        ):

                            del study_rooms[
                                owner_id
                            ]

                    # Remove room codes
                    for code, room_id in list(
                        room_codes.items()
                    ):

                        if room_id == room.id:

                            del room_codes[code]

                    # Remove room limit
                    room_limits.pop(
                        room.id,
                        None
                    )

                    print(
                        f"Deleted empty study room: "
                        f"{room_name}"
                    )

                except discord.NotFound:

                    pass


# =========================
# /LINK
# =========================

@bot.tree.command(
    name="link",
    description="Link your Discord account to your Mahei-Pathap account"
)
async def link(interaction: discord.Interaction, code: str):
    await interaction.response.defer(ephemeral=True)
    if not all([APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID, APPWRITE_DISCORD_LINK_REQUESTS_COLLECTION_ID, APPWRITE_DISCORD_USERS_COLLECTION_ID]):
        await interaction.followup.send("❌ Discord account linking is not configured on the bot yet.", ephemeral=True)
        return
    try:
        user_id = link_discord_account(code, interaction.user)
        await interaction.followup.send(
            "✅ Your Discord account is now linked to Mahei-Pathap. You can safely close the linking page.",
            ephemeral=True,
        )
        print(f"Linked Discord user {interaction.user.id} to Mahei user {user_id}.")
    except Exception as exc:
        await interaction.followup.send(f"❌ {exc}", ephemeral=True)


# =========================
# /SHARE
# =========================

@bot.tree.command(
    name="share",
    description="Create a code to share your study room"
)
async def share(
    interaction: discord.Interaction
):

    # Must be inside a voice channel
    if not interaction.user.voice:

        await interaction.response.send_message(
            "❌ You must be inside your study room first.",
            ephemeral=True
        )

        return

    room = interaction.user.voice.channel

    # Only owner can share
    if (
        room_owners.get(room.id)
        != interaction.user.id
    ):

        await interaction.response.send_message(
            "❌ Only the study-room host can share the room.",
            ephemeral=True
        )

        return

    # Generate code
    code = generate_room_code()

    room_codes[code] = room.id

    limit_text = get_limit_text(room.id)

    await interaction.response.send_message(

        f"🔗 **Study Room Share**\n\n"
        f"🔑 **Room Code:** `{code}`\n"
        f"🏠 **Room:** {room.name}\n"
        f"👥 **Maximum:** {limit_text}\n\n"
        f"Your friend can join the server and use:\n"
        f"`/join {code}`"
    )

    print(
        f"{interaction.user} created room code "
        f"{code} for {room.name}"
    )


# =========================
# /JOIN
# =========================

@bot.tree.command(
    name="join",
    description="Join a shared Mahei Pathap study room"
)
async def join(
    interaction: discord.Interaction,
    code: str
):

    code = code.upper().strip()

    room_id = room_codes.get(code)

    # -------------------------
    # INVALID CODE
    # -------------------------

    if room_id is None:

        await interaction.response.send_message(
            "❌ Invalid or expired study room code.",
            ephemeral=True
        )

        return

    room = interaction.guild.get_channel(
        room_id
    )

    # -------------------------
    # ROOM NO LONGER EXISTS
    # -------------------------

    if room is None:

        room_codes.pop(
            code,
            None
        )

        room_limits.pop(
            room_id,
            None
        )

        await interaction.response.send_message(
            "❌ This study room no longer exists.",
            ephemeral=True
        )

        return

    # -------------------------
    # BOT USER CHECK
    # -------------------------

    if interaction.user.bot:

        await interaction.response.send_message(
            "❌ Bots cannot join study rooms.",
            ephemeral=True
        )

        return

    # =========================
    # PER-ROOM LIMIT
    # =========================

    limit = room_limits.get(
        room.id,
        DEFAULT_ROOM_LIMIT
    )

    # 0 = unlimited
    if (
        limit > 0
        and len(room.members) >= limit
    ):

        await interaction.response.send_message(
            "❌ This study room is full.",
            ephemeral=True
        )

        return

    # =========================
    # BOT PERMISSION CHECK
    # =========================

    bot_member = interaction.guild.me

    permissions = room.permissions_for(
        bot_member
    )

    print(
        f"Bot permissions in {room.name}: "
        f"manage_channels="
        f"{permissions.manage_channels}, "
        f"manage_roles="
        f"{permissions.manage_roles}, "
        f"view_channel="
        f"{permissions.view_channel}, "
        f"connect="
        f"{permissions.connect}"
    )

    if not permissions.manage_roles:

        await interaction.response.send_message(
            "❌ The bot cannot manage permissions "
            "in this Study Room.",
            ephemeral=True
        )

        return

    # =========================
    # GIVE ACCESS
    # =========================

    overwrite = discord.PermissionOverwrite(
        view_channel=True,
        connect=True,
        speak=True,
        stream=True
    )

    try:

        await room.set_permissions(
            interaction.user,
            overwrite=overwrite,
            reason=(
                "Student joined shared "
                "Mahei Pathap study room"
            )
        )

    except discord.Forbidden:

        await interaction.response.send_message(
            "❌ Discord denied the permission change.",
            ephemeral=True
        )

        print(
            "❌ set_permissions() failed "
            "with 403 Forbidden."
        )

        return

    # =========================
    # SUCCESS
    # =========================

    await interaction.response.send_message(

        f"✅ You now have access to "
        f"**{room.name}**! 📚\n"
        f"Join it from **📚 {STUDY_CATEGORY}**."
    )

    print(
        f"{interaction.user} joined "
        f"{room.name} using code {code}"
    )


# =========================
# /INVITE
# =========================

@bot.tree.command(
    name="invite",
    description="Give a student access to your study room"
)
async def invite(
    interaction: discord.Interaction,
    student: discord.Member
):

    # Must be in voice
    if not interaction.user.voice:

        await interaction.response.send_message(
            "❌ You must be inside your study room first.",
            ephemeral=True
        )

        return

    room = interaction.user.voice.channel

    # Only owner
    if (
        room_owners.get(room.id)
        != interaction.user.id
    ):

        await interaction.response.send_message(
            "❌ Only the study-room host can invite students.",
            ephemeral=True
        )

        return

    # No bots
    if student.bot:

        await interaction.response.send_message(
            "❌ You cannot invite a bot.",
            ephemeral=True
        )

        return

    # Check permissions
    bot_member = interaction.guild.me

    permissions = room.permissions_for(
        bot_member
    )

    if not permissions.manage_roles:

        await interaction.response.send_message(
            "❌ The bot cannot manage permissions "
            "in this Study Room.",
            ephemeral=True
        )

        return

    try:

        await room.set_permissions(

            student,

            overwrite=discord.PermissionOverwrite(
                view_channel=True,
                connect=True,
                speak=True,
                stream=True
            ),

            reason="Study room invitation"
        )

    except discord.Forbidden:

        await interaction.response.send_message(
            "❌ Discord denied the permission change.",
            ephemeral=True
        )

        return

    await interaction.response.send_message(

        f"✅ {student.mention} can now join "
        f"your study room! 📚"
    )

    print(
        f"{interaction.user} invited "
        f"{student} to {room.name}"
    )


# =========================
# /REMOVE
# =========================

@bot.tree.command(
    name="remove",
    description="Remove a student from your study room"
)
async def remove(
    interaction: discord.Interaction,
    student: discord.Member
):

    # Must be inside voice channel
    if not interaction.user.voice:

        await interaction.response.send_message(
            "❌ You must be inside your study room first.",
            ephemeral=True
        )

        return

    room = interaction.user.voice.channel

    # Only owner
    if (
        room_owners.get(room.id)
        != interaction.user.id
    ):

        await interaction.response.send_message(
            "❌ Only the study-room host can remove students.",
            ephemeral=True
        )

        return

    # Host cannot remove themselves
    if student.id == interaction.user.id:

        await interaction.response.send_message(
            "❌ You cannot remove yourself as the host.",
            ephemeral=True
        )

        return

    # Check permissions
    bot_member = interaction.guild.me

    permissions = room.permissions_for(
        bot_member
    )

    if not permissions.manage_roles:

        await interaction.response.send_message(
            "❌ The bot cannot manage permissions "
            "in this Study Room.",
            ephemeral=True
        )

        return

    # Remove custom room permission
    try:

        await room.set_permissions(
            student,
            overwrite=None,
            reason="Removed from Mahei Pathap study room"
        )

    except discord.Forbidden:

        await interaction.response.send_message(
            "❌ Discord denied the permission change.",
            ephemeral=True
        )

        return

    # Move them back to Study Lounge
    if (
        student.voice
        and student.voice.channel
        and student.voice.channel.id == room.id
    ):

        study_lounge = discord.utils.get(
            interaction.guild.voice_channels,
            name=STUDY_LOUNGE
        )

        if study_lounge:

            try:

                await student.move_to(
                    study_lounge,
                    reason="Removed from study room"
                )

            except discord.Forbidden:

                print(
                    "❌ Could not move removed student "
                    "back to Study Lounge."
                )

    await interaction.response.send_message(

        f"✅ {student.mention} has been removed "
        f"from the study room."
    )

    print(
        f"{interaction.user} removed "
        f"{student} from {room.name}"
    )


# =========================
# /LIMIT
# =========================

@bot.tree.command(
    name="limit",
    description="Set the maximum number of students in your study room"
)
async def limit(
    interaction: discord.Interaction,
    members: int
):

    # Valid range
    if (
        members < 0
        or members > MAX_ROOM_LIMIT
    ):

        await interaction.response.send_message(
            f"❌ Choose a number from 0 to "
            f"{MAX_ROOM_LIMIT}.\n"
            f"0 means unlimited. ♾️",
            ephemeral=True
        )

        return

    # Must be in a voice channel
    if not interaction.user.voice:

        await interaction.response.send_message(
            "❌ You must be inside your study room first.",
            ephemeral=True
        )

        return

    room = interaction.user.voice.channel

    # Only owner
    if (
        room_owners.get(room.id)
        != interaction.user.id
    ):

        await interaction.response.send_message(
            "❌ Only the study-room host can change the limit.",
            ephemeral=True
        )

        return

    # Check bot permission
    bot_member = interaction.guild.me

    permissions = room.permissions_for(
        bot_member
    )

    if not permissions.manage_channels:

        await interaction.response.send_message(
            "❌ The bot cannot change this study room.",
            ephemeral=True
        )

        return

    try:

        # Save per-room limit
        room_limits[room.id] = members

        # Update Discord channel
        await room.edit(
            user_limit=members,
            reason=(
                "Study room limit changed "
                "by host"
            )
        )

    except discord.Forbidden:

        await interaction.response.send_message(
            "❌ Discord denied permission to "
            "change the room limit.",
            ephemeral=True
        )

        return

    if members == 0:

        message = (
            "♾️ Your study room is now "
            "**unlimited**."
        )

    else:

        message = (
            f"✅ Your study room limit is now "
            f"**{members} students**."
        )

    await interaction.response.send_message(
        message
    )

    print(
        f"{interaction.user} changed "
        f"{room.name} limit to {members}"
    )


# =========================
# /HELLO
# =========================

@bot.tree.command(
    name="hello",
    description="Check your Mahei-Pathap connection"
)
async def hello(
    interaction: discord.Interaction
):
    await interaction.response.defer(
        ephemeral=True
    )

    try:
        linked_user = get_linked_mahei_user(
            interaction.user.id
        )

        if linked_user:
            await interaction.followup.send(
                f"✅ Hello {interaction.user.mention}!\n\n"
                "🔗 Your Discord account is connected "
                "to your Mahei-Pathap account.",
                ephemeral=True,
            )
        else:
            await interaction.followup.send(
                f"👋 Hello {interaction.user.mention}!\n\n"
                "❌ Your Discord account is not linked "
                "to Mahei-Pathap yet.",
                ephemeral=True,
            )

    except Exception as exc:
        print(f"❌ /hello Appwrite error: {exc}")

        await interaction.followup.send(
            "❌ I couldn't check your Mahei-Pathap connection.",
            ephemeral=True,
        )

# *******************************************
#        /PROGRESS COMMAND
# *******************************************
@bot.tree.command(
    name="progress",
    description="View your Mahei-Pathap progress"
)
async def progress(interaction: discord.Interaction):
    discord_user_id = interaction.user.id

    linked_user = get_linked_mahei_user(
        discord_user_id
    )

    if not linked_user:
        await interaction.response.send_message(
            "❌ Your Discord account is not linked to Mahei-Pathap. Use `/link` first.",
            ephemeral=True
        )
        return

    appwrite_user_id = linked_user["appwrite_user_id"]

    progress_data = calculate_user_progress(
        appwrite_user_id
    )

    current_month = get_current_month_key()

    monthly_xp = get_monthly_xp(
        appwrite_user_id,
        current_month
    )

    embed = discord.Embed(
        title="📊 Your Mahei-Pathap Progress",
        description=f"Progress for {interaction.user.mention}",
        color=discord.Color.blurple()
    )

    embed.add_field(
        name="⭐ Total XP",
        value=str(progress_data["total_xp"]),
        inline=True
    )

    embed.add_field(
        name="📅 This Month",
        value=f"{monthly_xp} XP",
        inline=True
    )

    embed.add_field(
        name="🎯 Focus Sessions",
        value=str(progress_data["total_focus_sessions"]),
        inline=True
    )

    embed.add_field(
        name="⏱️ Focus Minutes",
        value=str(progress_data["total_focus_minutes"]),
        inline=True
    )

    await interaction.response.send_message(
        embed=embed
    )



# =========================
# START BOT
# =========================S

bot.run(TOKEN)