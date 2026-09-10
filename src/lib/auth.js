import { account, APPWRITE_SUGGESTIONS_COLLECTION_ID, APPWRITE_DATABASE_ID, databases, isAppwriteConfigured } from "./appwrite";

/**
 * Admin authorization helper.
 *
 * SECURITY MODEL
 * --------------
 * The admin identity is determined by an Appwrite **team membership**, not by
 * a hard-coded email or a secret stored in the frontend.
 *
 * Create a team in the Appwrite console (e.g. name it "admin" with a lower-case
 * slug). Add the single admin user as the **only** member of that team.
 *
 * Collection permissions then enforce real backend security:
 *
 *   suggestions           Create: users          Read/Update/Delete: team:admin
 *   announcements         Create/Update/Delete: team:admin   Read: users
 *   profileSettings       Create/Update/Delete: team:admin   Read: users
 *   donationSettings      Create/Update/Delete: team:admin   Read: users
 *   announcementDismissals Create/Read/Update/Delete: user:current (owner only)
 *
 * The frontend merely *hides* UI for non-admins; the Appwrite permissions above
 * are what actually block unauthorized access.
 */

const ADMIN_TEAM_NAME = "admin";

let cachedAdminState = null;

/**
 * Returns true if the currently logged-in user belongs to the Appwrite "admin" team.
 *
 * This is a real backend check via `account.listMemberships()` — it is NOT a
 * hard-coded email comparison.
 */
// export async function isAdminUser() {
//   if (!isAppwriteConfigured) return false;

//   if (cachedAdminState !== null) return cachedAdminState;

//   try {
//     const memberships = await account.listMemberships();
//     const isAdmin = memberships.memberships.some(
//       (m) => m.teamName.toLowerCase() === ADMIN_TEAM_NAME
//     );
//     cachedAdminState = isAdmin;
//     return isAdmin;
//   } catch {
//     cachedAdminState = false;
//     return false;
//   }
// }

// export function clearAdminCache() {
//   cachedAdminState = null;
// }

// export { ADMIN_TEAM_NAME };
export async function isAdminUser() {
  if (!isAppwriteConfigured) {
    console.log("ADMIN CHECK: Appwrite is NOT configured");
    return false;
  }

  try {
    const memberships = await account.listMemberships();

    console.log("ADMIN CHECK: memberships =", memberships.memberships);

    memberships.memberships.forEach((m) => {
      console.log(
        "TEAM:",
        m.teamName,
        "ROLES:",
        m.roles
      );
    });

    const isAdmin = memberships.memberships.some(
      (m) =>
        m.teamName &&
        m.teamName.trim().toLowerCase() === "admin"
    );

    console.log("ADMIN CHECK RESULT =", isAdmin);

    return isAdmin;
  } catch (error) {
    console.error("ADMIN CHECK ERROR =", error);
    return false;
  }
}
