# Discord ↔ Mahei-Pathap account linking

The Discord button now opens a dedicated Mahei-Pathap Discord page. A signed-in user can generate a short-lived linking code and then run `/link CODE` in the Mahei-Pathap Discord server.

## 1. Create two Appwrite collections

### `discord_link_requests`

Create these attributes:

| Attribute | Type | Required |
|---|---|---|
| `userId` | string (36) | yes |
| `codeHash` | string (64) | yes |
| `expiresAt` | datetime | yes |
| `used` | string (16) | yes |
| `created_at` | datetime | yes |
| `used_at` | datetime | no |
| `discord_user_id` | string (32) | no |

Create an index on `codeHash` and another on `used`.

### `discord_users`

Create these attributes:

| Attribute | Type | Required |
|---|---|---|
| `userId` | string (36) | yes |
| `discord_user_id` | string (32) | yes |
| `discord_username` | string (128) | yes |
| `linked_at` | datetime | yes |

Create a unique index on `discord_user_id` and a unique index on `userId`.

Keep both collections protected from client reads/writes. The website uses the Appwrite Function, and the bot uses its server-side API key.

## 2. Function variables

Add this variable to the existing `mahei-discord-integration` Appwrite Function:

```text
APPWRITE_DISCORD_LINK_REQUESTS_COLLECTION_ID=<your discord_link_requests collection ID>
```

The existing focus-session variables must remain configured.

The Function's database scope needs permission to read/write `discord_link_requests`.

## 3. Website variable

In the Vite environment used by the website:

```text
VITE_APPWRITE_DISCORD_INTEGRATION_FUNCTION_ID=mahei-discord-integration
VITE_APPWRITE_DISCORD_LINK_REQUESTS_COLLECTION_ID=<same collection ID>
VITE_DISCORD_INVITE_URL=https://discord.gg/BmYmwRrheX
```

The link-request collection ID is intentionally not a secret.

## 4. Bot variables

Create `Mahei-pathap-bot/.env` from the example and fill in:

```text
DISCORD_TOKEN=<your bot token>
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=<project ID>
APPWRITE_API_KEY=<server API key>
APPWRITE_DATABASE_ID=<database ID>
APPWRITE_DISCORD_LINK_REQUESTS_COLLECTION_ID=<link requests collection ID>
APPWRITE_DISCORD_USERS_COLLECTION_ID=<discord users collection ID>
```

The API key must be server-side only and should have the minimum database read/write scopes needed for these two collections.

## 5. User flow

1. User signs in to Mahei-Pathap.
2. User opens **Discord** from the left sidebar.
3. User joins the Discord server if needed.
4. User clicks **Generate Link Code**.
5. User runs `/link ABC12345` in Discord.
6. The bot validates the hashed, short-lived code and records the Discord ID ↔ Appwrite user ID link.

The raw linking code is never stored in Appwrite.
