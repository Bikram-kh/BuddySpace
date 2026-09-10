import crypto from "node:crypto";

const FOCUS_DURATION_MINUTES = 25;
const FOCUS_XP = 10;

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function json(res, body, status = 200) {
  return res.json(body, status);
}

function appwriteError(res, status, message) {
  return json(
    res,
    {
      ok: false,
      error: message,
    },
    status
  );
}

/* =========================================================
   HEADER HELPERS
========================================================= */

function getHeader(headers, name) {
  const expected = name.toLowerCase();

  const found = Object.entries(headers || {}).find(
    ([key]) => key.toLowerCase() === expected
  );

  return found?.[1] || "";
}

/* =========================================================
   CONFIGURATION
========================================================= */

function configured() {
  return [
    process.env.APPWRITE_FUNCTION_API_ENDPOINT,
    process.env.APPWRITE_FUNCTION_PROJECT_ID,
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_FOCUS_SESSIONS_COLLECTION_ID,
    process.env.APPWRITE_USER_MONTHLY_STATS_COLLECTION_ID,
  ].every(Boolean);
}

function configuredDiscordLink() {
  return Boolean(
    process.env.APPWRITE_DISCORD_LINK_REQUESTS_COLLECTION_ID &&
      process.env.APPWRITE_DISCORD_USERS_COLLECTION_ID
  );
}

/* =========================================================
   APPWRITE HTTP
========================================================= */

function apiHeaders(dynamicKey) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Appwrite-Project":
      process.env.APPWRITE_FUNCTION_PROJECT_ID,
    "X-Appwrite-Key": dynamicKey,
  };
}

async function request(path, dynamicKey, options = {}) {
  const response = await fetch(
    `${process.env.APPWRITE_FUNCTION_API_ENDPOINT}${path}`,
    {
      ...options,

      headers: {
        ...apiHeaders(dynamicKey),
        ...(options.headers || {}),
      },
    }
  );

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(
      body.message ||
        body.error ||
        `Appwrite request failed (${response.status}).`
    );

    err.status = response.status;

    throw err;
  }

  return body;
}

/* =========================================================
   TABLE HELPERS
========================================================= */

function tableBase(tableId) {
  return `/tablesdb/${encodeURIComponent(
    process.env.APPWRITE_DATABASE_ID
  )}/tables/${encodeURIComponent(tableId)}`;
}

async function createRow(
  tableId,
  data,
  dynamicKey,
  rowId = "unique()",
  transactionId = null
) {
  return request(
    `${tableBase(tableId)}/rows`,
    dynamicKey,
    {
      method: "POST",

      body: JSON.stringify({
        rowId,
        data,

        ...(transactionId
          ? {
              transactionId,
            }
          : {}),
      }),
    }
  );
}

async function getRow(
  tableId,
  rowId,
  dynamicKey,
  transactionId = null
) {
  const query = transactionId
    ? `?transactionId=${encodeURIComponent(transactionId)}`
    : "";

  return request(
    `${tableBase(tableId)}/rows/${encodeURIComponent(
      rowId
    )}${query}`,
    dynamicKey
  );
}

async function updateRow(
  tableId,
  rowId,
  data,
  dynamicKey,
  transactionId = null
) {
  return request(
    `${tableBase(tableId)}/rows/${encodeURIComponent(
      rowId
    )}`,
    dynamicKey,
    {
      method: "PATCH",

      body: JSON.stringify({
        data,

        ...(transactionId
          ? {
              transactionId,
            }
          : {}),
      }),
    }
  );
}

async function listRows(tableId, dynamicKey, limit = 100) {
  const rows = [];
  let offset = 0;

  while (true) {
    const page = await request(
      `${tableBase(tableId)}/rows?limit=${limit}&offset=${offset}`,
      dynamicKey
    );

    const pageRows = Array.isArray(page.rows)
      ? page.rows
      : [];

    rows.push(...pageRows);

    if (pageRows.length < limit) {
      break;
    }

    offset += pageRows.length;
  }

  return rows;
}

/* =========================================================
   DISCORD LINKING
========================================================= */

function hashLinkCode(code) {
  return crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
}

function generateLinkCode() {
  return crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();
}

async function createDiscordLink({
  userId,
  dynamicKey,
}) {
  if (!configuredDiscordLink()) {
    throw new Error(
      "Discord linking is not configured."
    );
  }

  const code =
    generateLinkCode();

  const expiresAt =
    new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString();

  const created =
    await createRow(
      process.env
        .APPWRITE_DISCORD_LINK_REQUESTS_COLLECTION_ID,

      {
        userId,

        codeHash:
          hashLinkCode(code),

        expiresAt,

        used: false,
      },

      dynamicKey
    );

  return {
    code,

    expiresAt,

    requestId:
      created.$id,
  };
}

async function checkDiscordLink({
  userId,
  dynamicKey,
}) {
  if (!configuredDiscordLink()) {
    throw new Error(
      "Discord linking is not configured."
    );
  }

  const discordUsersTable =
    process.env
      .APPWRITE_DISCORD_USERS_COLLECTION_ID;

  const rows =
    await listRows(
      discordUsersTable,
      dynamicKey
    );

  const linkedRow =
    rows.find(
      (row) =>
        String(
          row.appwrite_user_id || ""
        ) ===
        String(userId)
    );

  if (!linkedRow) {
    return {
      linked: false,
    };
  }

  return {
    linked: true,

    discordUserId:
      linkedRow.discord_user_id ||
      "",

    discordUsername:
      linkedRow.discord_username ||
      "",

    linkedAt:
      linkedRow.linked_at ||
      "",
  };
}

/* =========================================================
   FOCUS HELPERS
========================================================= */

function cleanSubject(value) {
  if (typeof value !== "string") {
    return "General Study";
  }

  const result =
    value
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 256);

  return (
    result ||
    "General Study"
  );
}

/* =========================================================
   START FOCUS

   IMPORTANT:
   There is intentionally NO list/query operation here.

   Start Focus only creates a new trusted server-side row.
   This means an "Invalid query" error cannot come from
   the start_focus database operation in this version.
========================================================= */

async function startFocusSession({
  userId,
  subject,
  dynamicKey,
}) {
  const focusTable =
    process.env
      .APPWRITE_FOCUS_SESSIONS_COLLECTION_ID;

  const startedAt =
    new Date().toISOString();

  const created =
    await createRow(
      focusTable,

      {
        appwrite_user_id:
          userId,

        subject:
          cleanSubject(
            subject
          ),

        started_at:
          startedAt,

        completed_at:
          startedAt,

        duration_minutes:
          FOCUS_DURATION_MINUTES,

        status:
          "active",

        xp_awarded:
          0,
      },

      dynamicKey
    );

  return {
    sessionId:
      created.$id,

    startedAt:
      created.started_at ||
      startedAt,

    reused:
      false,
  };
}

/* =========================================================
   MONTHLY STATS ROW ID
========================================================= */

function monthlyStatsRowId(
  userId,
  monthKey
) {
  return (
    "month_" +
    crypto
      .createHash("sha256")
      .update(
        `${userId}:${monthKey}`
      )
      .digest("hex")
      .slice(0, 28)
  );
}

/* =========================================================
   COMPLETE FOCUS
========================================================= */

async function completeFocusSession({
  userId,
  sessionId,
  dynamicKey,
}) {
  if (
    typeof sessionId !==
      "string" ||
    !/^[A-Za-z0-9._-]{1,36}$/.test(
      sessionId
    )
  ) {
    throw new Error(
      "A valid focus session is required."
    );
  }

  const focusTable =
    process.env
      .APPWRITE_FOCUS_SESSIONS_COLLECTION_ID;

  const statsTable =
    process.env
      .APPWRITE_USER_MONTHLY_STATS_COLLECTION_ID;

  /* -------------------------------------------------------
     GET SESSION
  ------------------------------------------------------- */

  const session =
    await getRow(
      focusTable,
      sessionId,
      dynamicKey
    );

  /* -------------------------------------------------------
     SECURITY CHECK
  ------------------------------------------------------- */

  if (
    session.appwrite_user_id !==
    userId
  ) {
    throw new Error(
      "This focus session belongs to another user."
    );
  }

  if (
    session.status !==
    "active"
  ) {
    throw new Error(
      "This focus session is not active."
    );
  }

  /* -------------------------------------------------------
     SERVER-SIDE TIME CHECK
  ------------------------------------------------------- */

  const startedAt =
    Date.parse(
      session.started_at
    );

  if (
    !Number.isFinite(
      startedAt
    )
  ) {
    throw new Error(
      "Focus session has an invalid start time."
    );
  }

  const elapsed =
    Date.now() -
    startedAt;

  if (
    elapsed <
    FOCUS_DURATION_MINUTES *
      60 *
      1000
  ) {
    throw new Error(
      "The 25-minute focus session has not completed yet."
    );
  }

  /* -------------------------------------------------------
     COMPLETION TIME
  ------------------------------------------------------- */

  const completedAt =
    new Date().toISOString();

  const monthKey =
    completedAt.slice(
      0,
      7
    );

  const statsRowId =
    monthlyStatsRowId(
      userId,
      monthKey
    );

  /* -------------------------------------------------------
     CHECK MONTHLY STATS BY ID

     No list query is used.
  ------------------------------------------------------- */

  let stats = null;

  try {
    stats =
      await getRow(
        statsTable,
        statsRowId,
        dynamicKey
      );
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }
  }

  /* -------------------------------------------------------
     CREATE TRANSACTION
  ------------------------------------------------------- */

  const transaction =
    await request(
      "/tablesdb/transactions",
      dynamicKey,
      {
        method: "POST",

        body: JSON.stringify({
          ttl: 60,
        }),
      }
    );

  const operations = [];

  /* -------------------------------------------------------
     COMPLETE SESSION
  ------------------------------------------------------- */

  operations.push({
    action:
      "update",

    databaseId:
      process.env.APPWRITE_DATABASE_ID,

    tableId:
      focusTable,

    rowId:
      session.$id,

    data: {
      status:
        "completed",

      completed_at:
        completedAt,

      xp_awarded:
        FOCUS_XP,
    },
  });

  /* -------------------------------------------------------
     UPDATE / CREATE MONTHLY STATS
  ------------------------------------------------------- */

  if (stats) {
    operations.push({
      action:
        "update",

      databaseId:
        process.env.APPWRITE_DATABASE_ID,

      tableId:
        statsTable,

      rowId:
        statsRowId,

      data: {
        appwrite_user_id:
          userId,

        month_key:
          monthKey,

        xp:
          Number(
            stats.xp || 0
          ) +
          FOCUS_XP,

        focus_minutes:
          Number(
            stats.focus_minutes ||
              0
          ) +
          FOCUS_DURATION_MINUTES,

        focus_sessions:
          Number(
            stats.focus_sessions ||
              0
          ) +
          1,

        updated_at:
          completedAt,
      },
    });
  } else {
    operations.push({
      action:
        "create",

      databaseId:
        process.env.APPWRITE_DATABASE_ID,

      tableId:
        statsTable,

      rowId:
        statsRowId,

      data: {
        appwrite_user_id:
          userId,

        month_key:
          monthKey,

        xp:
          FOCUS_XP,

        focus_minutes:
          FOCUS_DURATION_MINUTES,

        focus_sessions:
          1,

        updated_at:
          completedAt,
      },
    });
  }

  /* -------------------------------------------------------
     STAGE + COMMIT
  ------------------------------------------------------- */

  try {
    await request(
      `/tablesdb/transactions/${encodeURIComponent(
        transaction.$id
      )}/operations`,

      dynamicKey,

      {
        method: "POST",

        body: JSON.stringify({
          operations,
        }),
      }
    );

    await request(
      `/tablesdb/transactions/${encodeURIComponent(
        transaction.$id
      )}`,

      dynamicKey,

      {
        method: "PATCH",

        body: JSON.stringify({
          commit:
            true,
        }),
      }
    );
  } catch (error) {
    await request(
      `/tablesdb/transactions/${encodeURIComponent(
        transaction.$id
      )}`,

      dynamicKey,

      {
        method: "PATCH",

        body: JSON.stringify({
          rollback:
            true,
        }),
      }
    ).catch(() => {});

    throw error;
  }

  return {
    sessionId:
      session.$id,

    completedAt,

    xpAwarded:
      FOCUS_XP,

    monthKey,
  };
}

/* =========================================================
   FUNCTION ENTRY
========================================================= */

export default async ({
  req,
  res,
  log,
  error,
}) => {
  /* -------------------------------------------------------
     CONFIGURATION
  ------------------------------------------------------- */

  if (!configured()) {
    error(
      "Required Appwrite Function variables are missing."
    );

    return appwriteError(
      res,
      500,
      "The integration is not configured."
    );
  }

  /* -------------------------------------------------------
     AUTH
  ------------------------------------------------------- */

  const userId =
    getHeader(
      req.headers,
      "x-appwrite-user-id"
    );

  const dynamicKey =
    getHeader(
      req.headers,
      "x-appwrite-key"
    );

  if (
    !userId ||
    !dynamicKey
  ) {
    return appwriteError(
      res,
      401,
      "Authentication is required."
    );
  }

  /* -------------------------------------------------------
     METHOD
  ------------------------------------------------------- */

  if (
    req.method !==
    "POST"
  ) {
    return appwriteError(
      res,
      405,
      "Use POST."
    );
  }

  try {
    const body =
      req.bodyJson || {};

    /* =====================================================
       DISCORD LINK
    ===================================================== */

    if (
      body.action ===
      "create_discord_link"
    ) {
      const result =
        await createDiscordLink({
          userId,
          dynamicKey,
        });

      return json(
        res,
        {
          ok: true,
          ...result,
        }
      );
    }

    /* =====================================================
       CHECK DISCORD LINK
    ===================================================== */

    if (
      body.action ===
      "check_discord_link"
    ) {
      const result =
        await checkDiscordLink({
          userId,
          dynamicKey,
        });

      return json(
        res,
        {
          ok: true,
          ...result,
        }
      );
    }

    /* =====================================================
       START FOCUS
    ===================================================== */

    if (
      body.action ===
      "start_focus"
    ) {
      const result =
        await startFocusSession({
          userId,

          subject:
            body.subject,

          dynamicKey,
        });

      log(
        `Started trusted focus session ${result.sessionId} for user ${userId}.`
      );

      return json(
        res,
        {
          ok: true,
          ...result,
        }
      );
    }

    /* =====================================================
       COMPLETE FOCUS
    ===================================================== */

    if (
      body.action ===
      "complete_focus"
    ) {
      const result =
        await completeFocusSession({
          userId,

          sessionId:
            body.sessionId,

          dynamicKey,
        });

      log(
        `Completed trusted focus session ${result.sessionId} for user ${userId}.`
      );

      return json(
        res,
        {
          ok: true,
          ...result,
        }
      );
    }

    /* =====================================================
       UNKNOWN ACTION
    ===================================================== */

    return appwriteError(
      res,
      400,
      "Unsupported action."
    );
  } catch (caught) {
    const message =
      caught?.message ||
      String(caught);

    error(message);

    return appwriteError(
      res,
      400,
      message
    );
  }
};