# Discord Integration Setup

## Goal

Connect a Mahei-Pathap Appwrite user to a Discord user, then expose trusted study statistics through the existing Discord bot.

## Security design

The browser must not grant XP itself. The integration will use an Appwrite Function to validate activity and write XP/statistics server-side. The Discord bot will use a server-side Appwrite API key and will never expose that key to the webapp.

## Planned delivery order

1. Create the Appwrite collections and Function described below.
2. Implement a one-time `/link` command in the Discord bot and a matching webapp confirmation screen.
3. Move trusted focus-session completion into the Appwrite Function.
4. Add `/stats` and `/leaderboard` to the Discord bot.
5. Add scheduled monthly results and preserve the historical monthly rows.

## Step 1 — Create three new collections in the existing Appwrite database

Do **not** modify any current collection, collection ID, permission, project setting, or environment value.

Create these collections with Row Security enabled. IDs can be auto-generated; record the generated IDs for the next step.

### `discord_users`

| Attribute | Type | Required | Purpose |
| --- | --- | --- | --- |
| `appwrite_user_id` | string (36) | no | Linked Appwrite user ID. Empty until the web user confirms the link. |
| `discord_user_id` | string (32) | yes | Stable Discord user ID. |
| `discord_username` | string (128) | yes | Display-only Discord name. |
| `link_code_hash` | string (128) | no | Hash of the short-lived link code; never store the raw code. |
| `link_code_expires_at` | datetime | no | Link-code expiry time. |
| `linked_at` | datetime | no | Time the account was linked. |

Create a unique index for `discord_user_id` and another unique index for `appwrite_user_id` (where supported). No client-facing collection permissions are needed; the Function and bot use server-side access.

### `focus_sessions`

Use this only if a new trusted focus-session collection is permitted. It avoids changing the existing Focus collection.

| Attribute | Type | Required | Purpose |
| --- | --- | --- | --- |
| `appwrite_user_id` | string (36) | yes | Session owner. |
| `subject` | string (256) | yes | Focus subject. |
| `started_at` | datetime | yes | Server-recorded start time. |
| `completed_at` | datetime | no | Server-recorded completion time. |
| `duration_minutes` | integer | yes | Validated duration. |
| `status` | string (24) | yes | `active`, `completed`, or `abandoned`. |
| `xp_awarded` | integer | yes | XP actually awarded for this session. |

Index `appwrite_user_id` and `completed_at`.

### `user_monthly_stats`

| Attribute | Type | Required | Purpose |
| --- | --- | --- | --- |
| `appwrite_user_id` | string (36) | yes | Appwrite user ID. |
| `month_key` | string (7) | yes | Calendar month in `YYYY-MM`. |
| `xp` | integer | yes | Total XP for the month. |
| `focus_minutes` | integer | yes | Total validated focus minutes. |
| `focus_sessions` | integer | yes | Total completed validated sessions. |
| `updated_at` | datetime | yes | Latest update time. |

Create a composite unique index for `appwrite_user_id` and `month_key`.

## Step 2 — Create one Appwrite Function

Create a Node.js Appwrite Function named `mahei-discord-integration`. Allow execution only for authenticated users. It will be given the minimum database scopes needed to create/read/update the three new collections.

The function will own these operations:

- confirm a Discord link code for the signed-in Appwrite user;
- start and complete a focus session using server time;
- calculate XP only after a validated completion;
- update the matching monthly statistics atomically.

Use Function variables for the three collection IDs. Appwrite Functions receive a per-execution dynamic server key, and their scopes should be limited to the database operations the function needs. See the official Appwrite function documentation for the current setup details.

## XP rule — confirmation required

The project brief explicitly says not to implement arbitrary XP rules. The initial recommended rule is:

> A fully completed, server-validated 25-minute focus session awards 10 XP.

Please confirm this rule or provide your own before XP code is added.

## Bot secrets

Keep the following values only in `Mahei-pathap-bot/.env`; never place them in the Vite `.env` file or commit them:

```text
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=
APPWRITE_DISCORD_USERS_COLLECTION_ID=
APPWRITE_USER_MONTHLY_STATS_COLLECTION_ID=
```

The bot API key should have only the database read scopes it needs for `/stats` and `/leaderboard`.
