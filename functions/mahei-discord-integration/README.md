# Mahei Discord Integration Function

This is an Appwrite Node.js Function entrypoint. It starts and completes trusted 25-minute focus sessions.

## Function configuration

- Runtime: Node.js 20 or newer
- Entrypoint: `src/main.js`
- Build command: none
- Execute access: authenticated users only
- Dynamic-key scopes: `documents.read` and `documents.write`

Set these Function variables (not Vite variables):

```text
APPWRITE_DATABASE_ID=
APPWRITE_FOCUS_SESSIONS_COLLECTION_ID=focus_sessions
APPWRITE_USER_MONTHLY_STATS_COLLECTION_ID=user_monthly_stats
```

`APPWRITE_FUNCTION_API_ENDPOINT` and `APPWRITE_FUNCTION_PROJECT_ID` are injected by Appwrite. Do not create them manually.

The Function uses Appwrite transactions to update the focus session and that month's totals together. It accepts only `POST` requests from authenticated Appwrite users, gets their user ID from Appwrite's execution header, records its own start and completion times, and only grants 10 XP after at least 25 server-measured minutes.

## Browser configuration after deployment

Once this Function is deployed, add its generated Function ID to the webapp deployment environment as:

```text
VITE_APPWRITE_DISCORD_INTEGRATION_FUNCTION_ID=
```

Do not put any server API key in the Vite environment.


### Discord account linking
Set `APPWRITE_DISCORD_LINK_REQUESTS_COLLECTION_ID` to the existing `discord_link_requests` collection ID. The collection uses `userId`, `codeHash`, `expiresAt`, and `used`.
