import { Account, Client, Databases, Functions, Teams, Query } from "appwrite";

const endpoint =
  import.meta.env.VITE_APPWRITE_ENDPOINT ||
  "https://cloud.appwrite.io/v1";

const projectId =
  import.meta.env.VITE_APPWRITE_PROJECT_ID || "";

const databaseId =
  import.meta.env.VITE_APPWRITE_DATABASE_ID || "";

const tasksCollectionId =
  import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID || "";

const assignmentsCollectionId =
  import.meta.env.VITE_APPWRITE_ASSIGNMENTS_COLLECTION_ID || "";

const skillsCollectionId =
  import.meta.env.VITE_APPWRITE_SKILLS_COLLECTION_ID || "";

const goalsCollectionId =
  import.meta.env.VITE_APPWRITE_GOALS_COLLECTION_ID || "";

const focusCollectionId =
  import.meta.env.VITE_APPWRITE_FOCUS_COLLECTION_ID || "";

const notesCollectionId =
  import.meta.env.VITE_APPWRITE_NOTES_COLLECTION_ID || "";

const suggestionsCollectionId =
  import.meta.env.VITE_APPWRITE_SUGGESTIONS_COLLECTION_ID || "";

const announcementsCollectionId =
  import.meta.env.VITE_APPWRITE_ANNOUNCEMENTS_COLLECTION_ID || "";

const profileSettingsCollectionId =
  import.meta.env.VITE_APPWRITE_PROFILE_SETTINGS_COLLECTION_ID || "";

const donationSettingsCollectionId =
  import.meta.env.VITE_APPWRITE_DONATION_SETTINGS_COLLECTION_ID || "";

const announcementDismissalsCollectionId =
  import.meta.env.VITE_APPWRITE_ANNOUNCEMENT_DISMISSALS_COLLECTION_ID || "";

const discordIntegrationFunctionId =
  import.meta.env.VITE_APPWRITE_DISCORD_INTEGRATION_FUNCTION_ID || "";


/* =========================================================
   APPWRITE CLIENT
   ========================================================= */

const client = new Client();

client
  .setEndpoint(endpoint)
  .setProject(projectId);


/* =========================================================
   APPWRITE SERVICES
   ========================================================= */

export const account = new Account(client);

export const databases = new Databases(client);

export const teams = new Teams(client);

export const functions = new Functions(client);


/* =========================================================
   DATABASE / COLLECTION IDS
   ========================================================= */

export const APPWRITE_DATABASE_ID = databaseId;

export const APPWRITE_TASKS_COLLECTION_ID =
  tasksCollectionId;

export const APPWRITE_ASSIGNMENTS_COLLECTION_ID =
  assignmentsCollectionId;

export const APPWRITE_SKILLS_COLLECTION_ID =
  skillsCollectionId;

export const APPWRITE_GOALS_COLLECTION_ID =
  goalsCollectionId;

export const APPWRITE_FOCUS_COLLECTION_ID =
  focusCollectionId;

export const APPWRITE_NOTES_COLLECTION_ID =
  notesCollectionId;

export const APPWRITE_SUGGESTIONS_COLLECTION_ID =
  suggestionsCollectionId;

export const APPWRITE_ANNOUNCEMENTS_COLLECTION_ID =
  announcementsCollectionId;

export const APPWRITE_PROFILE_SETTINGS_COLLECTION_ID =
  profileSettingsCollectionId;

export const APPWRITE_DONATION_SETTINGS_COLLECTION_ID =
  donationSettingsCollectionId;

export const APPWRITE_ANNOUNCEMENT_DISMISSALS_COLLECTION_ID =
  announcementDismissalsCollectionId;

export const APPWRITE_DISCORD_INTEGRATION_FUNCTION_ID =
  discordIntegrationFunctionId;


/* =========================================================
   APPWRITE CONFIGURATION CHECK
   ========================================================= */

export const isAppwriteConfigured = Boolean(
  projectId &&
    databaseId &&
    tasksCollectionId &&
    assignmentsCollectionId &&
    skillsCollectionId &&
    goalsCollectionId &&
    focusCollectionId &&
    notesCollectionId
);


/* =========================================================
   ADMIN MEMBERSHIP COMPATIBILITY
   =========================================================

   Your auth.js uses:

       account.listMemberships()

   Appwrite provides team memberships through the Teams API,
   not the Account API.

   This compatibility function allows your existing auth.js
   to continue using account.listMemberships().
   ========================================================= */

account.listMemberships = async () => {
  const teamList = await teams.list();

  const membershipLists = await Promise.all(
    (teamList.teams || []).map(async (team) => {

      const result = await teams.listMemberships(team.$id);

      return (result.memberships || []).map((membership) => ({
        ...membership,

        teamName: team.name,

        teamId: team.$id,
      }));
    })
  );

  const memberships = membershipLists.flat();

  return {
    memberships,

    total: memberships.length,
  };
};


/* =========================================================
   QUERY
   ========================================================= */

export { Query };