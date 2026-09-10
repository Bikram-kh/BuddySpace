import React, { useCallback, useEffect, useState } from "react";
import { ID } from "appwrite";
import {
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  User,
  Heart,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  CheckCircle2,
} from "lucide-react";

import {
  account,
  databases,
  APPWRITE_DATABASE_ID,
  APPWRITE_SUGGESTIONS_COLLECTION_ID,
  APPWRITE_ANNOUNCEMENTS_COLLECTION_ID,
  APPWRITE_PROFILE_SETTINGS_COLLECTION_ID,
  APPWRITE_DONATION_SETTINGS_COLLECTION_ID,
  isAppwriteConfigured,
} from "../lib/appwrite";

export default function AdminDashboard() {
  const [section, setSection] = useState("overview");

  const [suggestions, setSuggestions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [profile, setProfile] = useState(null);
  const [donation, setDonation] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  /* =========================================================
     ANNOUNCEMENT FORM
  ========================================================= */

  const emptyAnnouncement = {
    title: "",
    message: "",
    priority: "normal",
    expiresAt: "",
  };

  const [announcementForm, setAnnouncementForm] =
    useState(emptyAnnouncement);

  const [editAnnouncementId, setEditAnnouncementId] = useState(null);

  /* =========================================================
     PROFILE FORM

     IMPORTANT:
     Your profileSettings table contains:
     name
     bio
     profileImage
     skills
     github
     email
     socialLinks
     userId

     It does NOT contain:
     role
     location
  ========================================================= */

  const emptyProfile = {
    name: "",
    bio: "",
    profileImage: "",
    skills: "",
    github: "",
    email: "",
    socialLinks: "",
  };

  const [profileForm, setProfileForm] = useState(emptyProfile);

  /* =========================================================
     DONATION FORM
  ========================================================= */

  const emptyDonation = {
    upiId: "",
    donationMessage: "",
    qrImage: "",
    isEnabled: true,
  };

  const [donationForm, setDonationForm] = useState(emptyDonation);

  /* =========================================================
     HELPERS
  ========================================================= */

  const clearMessages = () => {
    setError("");
    setNotice("");
  };

  const showError = (message, err = null) => {
    console.error(message, err);

    let finalMessage = message;

    if (err?.message) {
      finalMessage += ` ${err.message}`;
    }

    setError(finalMessage);
    setNotice("");
  };

  const showNotice = (message) => {
    setNotice(message);
    setError("");

    setTimeout(() => {
      setNotice("");
    }, 3000);
  };

  const safeString = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value);
  };

  const convertToDateTimeLocal = (value) => {
    if (!value) {
      return "";
    }

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return "";
      }

      const offset = date.getTimezoneOffset();

      const localDate = new Date(
        date.getTime() - offset * 60000
      );

      return localDate.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  /* =========================================================
     LOAD ALL ADMIN DATA
  ========================================================= */

  const loadAll = useCallback(async () => {
    if (!isAppwriteConfigured) {
      setLoading(false);

      setError(
        "Appwrite is not configured. Check your .env file."
      );

      return;
    }

    try {
      clearMessages();

      /* -----------------------------------------
         GET LOGGED-IN USER
      ----------------------------------------- */

      let user = null;

      try {
        user = await account.get();
        setCurrentUser(user);
      } catch (err) {
        console.error(
          "Unable to get current user:",
          err
        );
      }

      /* -----------------------------------------
         LOAD COLLECTIONS
      ----------------------------------------- */

      const requests = [];

      if (APPWRITE_SUGGESTIONS_COLLECTION_ID) {
        requests.push(
          databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_SUGGESTIONS_COLLECTION_ID
          )
        );
      } else {
        requests.push(
          Promise.resolve({
            documents: [],
          })
        );
      }

      if (APPWRITE_ANNOUNCEMENTS_COLLECTION_ID) {
        requests.push(
          databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_ANNOUNCEMENTS_COLLECTION_ID
          )
        );
      } else {
        requests.push(
          Promise.resolve({
            documents: [],
          })
        );
      }

      if (APPWRITE_PROFILE_SETTINGS_COLLECTION_ID) {
        requests.push(
          databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_PROFILE_SETTINGS_COLLECTION_ID
          )
        );
      } else {
        requests.push(
          Promise.resolve({
            documents: [],
          })
        );
      }

      if (APPWRITE_DONATION_SETTINGS_COLLECTION_ID) {
        requests.push(
          databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_DONATION_SETTINGS_COLLECTION_ID
          )
        );
      } else {
        requests.push(
          Promise.resolve({
            documents: [],
          })
        );
      }

      const [
        suggestionsRes,
        announcementsRes,
        profileRes,
        donationRes,
      ] = await Promise.all(requests);

      setSuggestions(
        suggestionsRes.documents || []
      );

      setAnnouncements(
        announcementsRes.documents || []
      );

      /* -----------------------------------------
         PROFILE
      ----------------------------------------- */

      const profileDocument =
        profileRes.documents?.[0] || null;

      setProfile(profileDocument);

      if (profileDocument) {
        let skillsValue = "";

        if (Array.isArray(profileDocument.skills)) {
          skillsValue =
            profileDocument.skills.join(", ");
        } else {
          skillsValue =
            safeString(profileDocument.skills);
        }

        setProfileForm({
          name: safeString(profileDocument.name),
          bio: safeString(profileDocument.bio),
          profileImage: safeString(
            profileDocument.profileImage
          ),
          skills: skillsValue,
          github: safeString(profileDocument.github),
          email: safeString(profileDocument.email),
          socialLinks: safeString(
            profileDocument.socialLinks
          ),
        });
      } else {
        setProfileForm({
          ...emptyProfile,
        });
      }

      /* -----------------------------------------
         DONATION
      ----------------------------------------- */

      const donationDocument =
        donationRes.documents?.[0] || null;

      setDonation(donationDocument);

      if (donationDocument) {
        setDonationForm({
          upiId: safeString(
            donationDocument.upiId
          ),

          donationMessage: safeString(
            donationDocument.donationMessage
          ),

          qrImage: safeString(
            donationDocument.qrImage
          ),

          isEnabled:
            donationDocument.isEnabled !== false,
        });
      } else {
        setDonationForm({
          ...emptyDonation,
        });
      }
    } catch (err) {
      showError(
        "Unable to load admin data.",
        err
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* =========================================================
     ANNOUNCEMENTS
  ========================================================= */

  const handleAnnouncementChange = (event) => {
    const { name, value } = event.target;

    setAnnouncementForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      ...emptyAnnouncement,
    });

    setEditAnnouncementId(null);
  };

  const startEditAnnouncement = (announcement) => {
    clearMessages();

    setEditAnnouncementId(
      announcement.$id
    );

    setAnnouncementForm({
      title: safeString(announcement.title),
      message: safeString(announcement.message),
      priority:
        safeString(announcement.priority) ||
        "normal",
      expiresAt:
        convertToDateTimeLocal(
          announcement.expiresAt
        ),
    });

    setSection("announcements");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const saveAnnouncement = async (event) => {
    event.preventDefault();

    const title =
      safeString(announcementForm.title).trim();

    const message =
      safeString(announcementForm.message).trim();

    if (!title) {
      setError(
        "Please enter an announcement title."
      );
      return;
    }

    if (!message) {
      setError(
        "Please enter an announcement message."
      );
      return;
    }

    setSaving(true);
    clearMessages();

    try {
      /* -----------------------------------------
         GET USER ID

         createdBy is required by your
         announcements table.
      ----------------------------------------- */

      let userId =
        currentUser?.$id || "";

      if (!userId) {
        const user = await account.get();

        userId = user.$id;

        setCurrentUser(user);
      }

      if (!userId) {
        throw new Error(
          "Unable to determine logged-in user."
        );
      }

      /* -----------------------------------------
         DATA

         Only use fields that belong to the
         announcements table.
      ----------------------------------------- */

      const data = {
        title: title,
        message: message,
        priority:
          announcementForm.priority ||
          "normal",

        createdBy: userId,
      };

      if (
        announcementForm.expiresAt
      ) {
        const expiryDate = new Date(
          announcementForm.expiresAt
        );

        if (
          !Number.isNaN(
            expiryDate.getTime()
          )
        ) {
          data.expiresAt =
            expiryDate.toISOString();
        }
      } else {
        data.expiresAt = null;
      }

      /* -----------------------------------------
         UPDATE
      ----------------------------------------- */

      if (editAnnouncementId) {
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_ANNOUNCEMENTS_COLLECTION_ID,
          editAnnouncementId,
          data
        );

        showNotice(
          "Announcement updated successfully."
        );
      }

      /* -----------------------------------------
         CREATE
      ----------------------------------------- */

      else {
        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_ANNOUNCEMENTS_COLLECTION_ID,
          ID.unique(),
          data
        );

        showNotice(
          "Announcement created successfully."
        );
      }

      resetAnnouncementForm();

      await loadAll();
    } catch (err) {
      showError(
        "Unable to save announcement.",
        err
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteAnnouncement = async (
    announcementId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this announcement?"
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    clearMessages();

    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ANNOUNCEMENTS_COLLECTION_ID,
        announcementId
      );

      showNotice(
        "Announcement deleted successfully."
      );

      if (
        editAnnouncementId ===
        announcementId
      ) {
        resetAnnouncementForm();
      }

      await loadAll();
    } catch (err) {
      showError(
        "Unable to delete announcement.",
        err
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     ABOUT ME
  ========================================================= */

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfileForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    const name =
      safeString(profileForm.name).trim();

    const bio =
      safeString(profileForm.bio).trim();

    if (!name) {
      setError("Name is required.");
      return;
    }

    if (!bio) {
      setError("Bio is required.");
      return;
    }

    setSaving(true);
    clearMessages();

    try {
      /* -----------------------------------------
         GET USER ID
      ----------------------------------------- */

      let userId =
        profile?.userId ||
        currentUser?.$id ||
        "";

      if (!userId) {
        const user = await account.get();

        userId = user.$id;

        setCurrentUser(user);
      }

      if (!userId) {
        throw new Error(
          "Unable to determine the logged-in user's ID."
        );
      }

      /* -----------------------------------------
         IMPORTANT

         Your profileSettings table DOES NOT
         contain role or location.

         Therefore we DO NOT send them.

         Your table has:
         name
         bio
         profileImage
         skills
         github
         email
         socialLinks
         userId
      ----------------------------------------- */

      const data = {
        name: name,

        bio: bio,

        profileImage:
          safeString(
            profileForm.profileImage
          ).trim(),

        skills:
          safeString(
            profileForm.skills
          ).trim(),

        github:
          safeString(
            profileForm.github
          ).trim(),

        email:
          safeString(
            profileForm.email
          ).trim(),

        socialLinks:
          safeString(
            profileForm.socialLinks
          ).trim(),

        userId: userId,
      };

      let savedProfile;

      /* -----------------------------------------
         UPDATE EXISTING PROFILE
      ----------------------------------------- */

      if (profile?.$id) {
        savedProfile =
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_PROFILE_SETTINGS_COLLECTION_ID,
            profile.$id,
            data
          );

        showNotice(
          "About Me information updated successfully."
        );
      }

      /* -----------------------------------------
         CREATE PROFILE
      ----------------------------------------- */

      else {
        savedProfile =
          await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_PROFILE_SETTINGS_COLLECTION_ID,
            ID.unique(),
            data
          );

        showNotice(
          "About Me information created successfully."
        );
      }

      setProfile(savedProfile);

      setProfileForm({
        name: safeString(
          savedProfile.name
        ),

        bio: safeString(
          savedProfile.bio
        ),

        profileImage:
          safeString(
            savedProfile.profileImage
          ),

        skills:
          safeString(
            savedProfile.skills
          ),

        github:
          safeString(
            savedProfile.github
          ),

        email:
          safeString(
            savedProfile.email
          ),

        socialLinks:
          safeString(
            savedProfile.socialLinks
          ),
      });
    } catch (err) {
      showError(
        "Unable to save About Me information.",
        err
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DONATION
  ========================================================= */

  const handleDonationChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setDonationForm((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const saveDonation = async (event) => {
    event.preventDefault();

    setSaving(true);
    clearMessages();

    try {
      /* -----------------------------------------
         IMPORTANT

         Your donationSettings table requires:
         isEnabled
      ----------------------------------------- */

      const data = {
        upiId:
          safeString(
            donationForm.upiId
          ).trim(),

        donationMessage:
          safeString(
            donationForm.donationMessage
          ).trim(),

        qrImage:
          safeString(
            donationForm.qrImage
          ).trim(),

        isEnabled:
          Boolean(
            donationForm.isEnabled
          ),
      };

      let savedDonation;

      /* -----------------------------------------
         UPDATE
      ----------------------------------------- */

      if (donation?.$id) {
        savedDonation =
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_DONATION_SETTINGS_COLLECTION_ID,
            donation.$id,
            data
          );

        showNotice(
          "Donation settings updated successfully."
        );
      }

      /* -----------------------------------------
         CREATE
      ----------------------------------------- */

      else {
        savedDonation =
          await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_DONATION_SETTINGS_COLLECTION_ID,
            ID.unique(),
            data
          );

        showNotice(
          "Donation settings created successfully."
        );
      }

      setDonation(savedDonation);

      setDonationForm({
        upiId:
          safeString(
            savedDonation.upiId
          ),

        donationMessage:
          safeString(
            savedDonation.donationMessage
          ),

        qrImage:
          safeString(
            savedDonation.qrImage
          ),

        isEnabled:
          savedDonation.isEnabled !== false,
      });
    } catch (err) {
      showError(
        "Unable to save donation settings.",
        err
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     SUGGESTIONS
  ========================================================= */

  const updateSuggestionStatus = async (
    suggestion,
    status
  ) => {
    setSaving(true);
    clearMessages();

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SUGGESTIONS_COLLECTION_ID,
        suggestion.$id,
        {
          status: status,
        }
      );

      showNotice(
        "Suggestion status updated."
      );

      await loadAll();
    } catch (err) {
      showError(
        "Unable to update suggestion.",
        err
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="empty-state">
        <span>⏳</span>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  /* =========================================================
     STATS
  ========================================================= */

  const newSuggestionsCount =
    suggestions.filter(
      (suggestion) =>
        suggestion.status === "New"
    ).length;

  const activeAnnouncements =
    announcements.filter(
      (announcement) =>
        !announcement.expiresAt ||
        new Date(
          announcement.expiresAt
        ).getTime() > Date.now()
    ).length;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="page-stack">

      {/* HEADER */}

      <section
        className="card admin-hero"
        style={{
          background: "white",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "20px",
        }}
      >
        <h2>Admin Dashboard</h2>

        <p>
          Manage Mahei-Pathap content and
          student feedback.
        </p>
      </section>

      {/* ERROR */}

      {error && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "12px",
            background: "#fff0ed",
            color: "#c94b35",
            border: "1px solid #ffd2c9",
            marginBottom: "16px",
          }}
        >
          <strong>Error:</strong>{" "}
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {notice && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "12px",
            background: "#effaf2",
            color: "#287a3e",
            border: "1px solid #c9ecd2",
            marginBottom: "16px",
          }}
        >
          <CheckCircle2
            size={16}
            style={{
              verticalAlign: "middle",
              marginRight: "6px",
            }}
          />

          {notice}
        </div>
      )}

      {/* ADMIN LAYOUT */}

      <div
        className="admin-layout"
        style={{
          display: "grid",
          gridTemplateColumns:
            "190px minmax(0, 1fr)",
          gap: "20px",
          alignItems: "start",
        }}
      >

        {/* NAVIGATION */}

        <div className="admin-nav">

          <button
            className={
              section === "overview"
                ? "active"
                : ""
            }
            onClick={() =>
              setSection("overview")
            }
          >
            <LayoutDashboard size={16} />
            Overview
          </button>

          <button
            className={
              section === "suggestions"
                ? "active"
                : ""
            }
            onClick={() =>
              setSection("suggestions")
            }
          >
            <MessageSquare size={16} />
            Suggestions
          </button>

          <button
            className={
              section === "announcements"
                ? "active"
                : ""
            }
            onClick={() =>
              setSection("announcements")
            }
          >
            <Megaphone size={16} />
            Announcements
          </button>

          <button
            className={
              section === "profile"
                ? "active"
                : ""
            }
            onClick={() =>
              setSection("profile")
            }
          >
            <User size={16} />
            About Me
          </button>

          <button
            className={
              section === "donation"
                ? "active"
                : ""
            }
            onClick={() =>
              setSection("donation")
            }
          >
            <Heart size={16} />
            Donation
          </button>

        </div>

        {/* CONTENT */}

        <div
          className="admin-content"
          style={{
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "20px",
          }}
        >

          {/* =================================================
              OVERVIEW
          ================================================= */}

          {section === "overview" && (
            <div className="page-stack">

              <h3>Overview</h3>

              <p>
                Welcome to the Mahei-Pathap
                administration dashboard.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "16px",
                  marginTop: "20px",
                }}
              >

                <div
                  className="card"
                  style={{
                    padding: "20px",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: "28px",
                    }}
                  >
                    {newSuggestionsCount}
                  </strong>

                  <span>
                    New Suggestions
                  </span>
                </div>

                <div
                  className="card"
                  style={{
                    padding: "20px",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: "28px",
                    }}
                  >
                    {activeAnnouncements}
                  </strong>

                  <span>
                    Active Announcements
                  </span>
                </div>

                <div
                  className="card"
                  style={{
                    padding: "20px",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: "28px",
                    }}
                  >
                    {suggestions.length}
                  </strong>

                  <span>
                    Total Suggestions
                  </span>
                </div>

                <div
                  className="card"
                  style={{
                    padding: "20px",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: "28px",
                    }}
                  >
                    {announcements.length}
                  </strong>

                  <span>
                    Total Announcements
                  </span>
                </div>

              </div>
            </div>
          )}

          {/* =================================================
              SUGGESTIONS
          ================================================= */}

          {section === "suggestions" && (
            <div className="page-stack">

              <h3>Suggestions</h3>

              {suggestions.length === 0 ? (
                <div className="empty-state">
                  <span>💡</span>
                  <p>
                    No suggestions found.
                  </p>
                </div>
              ) : (
                <div className="page-stack">

                  {suggestions.map(
                    (suggestion) => (
                      <div
                        className="card"
                        key={
                          suggestion.$id
                        }
                        style={{
                          padding: "18px",
                        }}
                      >

                        <strong>
                          {suggestion.title ||
                            "Suggestion"}
                        </strong>

                        <p>
                          {suggestion.suggestion ||
                            suggestion.message ||
                            suggestion.content ||
                            "No message provided."}
                        </p>

                        <small>
                          Status:{" "}
                          {suggestion.status ||
                            "Unknown"}
                        </small>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "14px",
                            flexWrap: "wrap",
                          }}
                        >

                          <button
                            type="button"
                            className="dark-button"
                            disabled={saving}
                            onClick={() =>
                              updateSuggestionStatus(
                                suggestion,
                                "Reviewed"
                              )
                            }
                          >
                            <CheckCircle2
                              size={15}
                            />

                            Mark Reviewed
                          </button>

                          <button
                            type="button"
                            className="dark-button"
                            disabled={saving}
                            onClick={() =>
                              updateSuggestionStatus(
                                suggestion,
                                "Resolved"
                              )
                            }
                          >
                            Resolved
                          </button>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>
          )}

          {/* =================================================
              ANNOUNCEMENTS
          ================================================= */}

          {section === "announcements" && (
            <div className="page-stack">

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >

                <div>
                  <h3>
                    Announcements
                  </h3>

                  <p>
                    Create, edit and delete
                    announcements.
                  </p>
                </div>

                <button
                  type="button"
                  className="dark-button"
                  onClick={() => {
                    resetAnnouncementForm();
                    clearMessages();
                  }}
                >
                  <Plus size={16} />
                  New Announcement
                </button>

              </div>

              {/* FORM */}

              <form
                onSubmit={saveAnnouncement}
                className="card"
                style={{
                  padding: "20px",
                  background: "#fffaf6",
                }}
              >

                <h4>
                  {editAnnouncementId
                    ? "Edit Announcement"
                    : "Create Announcement"}
                </h4>

                <div
                  style={{
                    display: "grid",
                    gap: "14px",
                  }}
                >

                  <label>
                    <strong>Title</strong>

                    <input
                      name="title"
                      value={
                        announcementForm.title
                      }
                      onChange={
                        handleAnnouncementChange
                      }
                      placeholder="Announcement title"
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "11px",
                        borderRadius: "10px",
                        border:
                          "1px solid var(--border)",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>

                  <label>
                    <strong>Message</strong>

                    <textarea
                      name="message"
                      value={
                        announcementForm.message
                      }
                      onChange={
                        handleAnnouncementChange
                      }
                      placeholder="Write your announcement..."
                      rows={5}
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "11px",
                        borderRadius: "10px",
                        border:
                          "1px solid var(--border)",
                        resize: "vertical",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>

                  <label>
                    <strong>Priority</strong>

                    <select
                      name="priority"
                      value={
                        announcementForm.priority
                      }
                      onChange={
                        handleAnnouncementChange
                      }
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "11px",
                        borderRadius: "10px",
                        border:
                          "1px solid var(--border)",
                      }}
                    >
                      <option value="normal">
                        Normal
                      </option>

                      <option value="important">
                        Important
                      </option>

                      <option value="urgent">
                        Urgent
                      </option>
                    </select>
                  </label>

                  <label>
                    <strong>
                      Expiry date/time
                    </strong>

                    <input
                      type="datetime-local"
                      name="expiresAt"
                      value={
                        announcementForm.expiresAt
                      }
                      onChange={
                        handleAnnouncementChange
                      }
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "11px",
                        borderRadius: "10px",
                        border:
                          "1px solid var(--border)",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >

                    <button
                      type="submit"
                      className="dark-button"
                      disabled={saving}
                    >
                      <Save size={16} />

                      {saving
                        ? "Saving..."
                        : editAnnouncementId
                        ? "Update Announcement"
                        : "Publish Announcement"}
                    </button>

                    {editAnnouncementId && (
                      <button
                        type="button"
                        className="dark-button"
                        onClick={
                          resetAnnouncementForm
                        }
                        disabled={saving}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    )}

                  </div>

                </div>
              </form>

              {/* EXISTING ANNOUNCEMENTS */}

              <div className="page-stack">

                <h4>
                  Existing Announcements
                </h4>

                {announcements.length ===
                0 ? (
                  <div className="empty-state">
                    <span>📢</span>

                    <p>
                      No announcements found.
                    </p>
                  </div>
                ) : (
                  announcements.map(
                    (announcement) => (
                      <div
                        className="card"
                        key={
                          announcement.$id
                        }
                        style={{
                          padding: "18px",
                        }}
                      >

                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            gap: "15px",
                            alignItems:
                              "flex-start",
                          }}
                        >

                          <div>

                            <strong>
                              {announcement.title ||
                                "Announcement"}
                            </strong>

                            <p>
                              {announcement.message ||
                                "No message provided."}
                            </p>

                            <small>
                              Priority:{" "}
                              {announcement.priority ||
                                "normal"}

                              {announcement.expiresAt
                                ? ` • Expires: ${new Date(
                                    announcement.expiresAt
                                  ).toLocaleString()}`
                                : ""}
                            </small>

                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                            }}
                          >

                            <button
                              type="button"
                              className="dark-button"
                              disabled={saving}
                              onClick={() =>
                                startEditAnnouncement(
                                  announcement
                                )
                              }
                            >
                              <Pencil
                                size={15}
                              />

                              Edit
                            </button>

                            <button
                              type="button"
                              className="dark-button"
                              disabled={saving}
                              onClick={() =>
                                deleteAnnouncement(
                                  announcement.$id
                                )
                              }
                            >
                              <Trash2
                                size={15}
                              />

                              Delete
                            </button>

                          </div>

                        </div>

                      </div>
                    )
                  )
                )}

              </div>

            </div>
          )}

          {/* =================================================
              ABOUT ME
          ================================================= */}

          {section === "profile" && (
            <div className="page-stack">

              <h3>About Me</h3>

              <p>
                Update the information shown
                on your public About Me page.
              </p>

              <form
                onSubmit={saveProfile}
                className="card"
                style={{
                  padding: "20px",
                  background: "#fffaf6",
                }}
              >

                <div
                  style={{
                    display: "grid",
                    gap: "14px",
                  }}
                >

                  <label>
                    <strong>
                      Name *
                    </strong>

                    <input
                      name="name"
                      value={
                        profileForm.name
                      }
                      onChange={
                        handleProfileChange
                      }
                      placeholder="Your name"
                      required
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "11px",
                        borderRadius: "10px",
                        border:
                          "1px solid var(--border)",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>

                  <label>
                    <strong>
                      Bio *
                    </strong>

                    <textarea
                      name="bio"
                      value={
                        profileForm.bio
                      }
                      onChange={
                        handleProfileChange
                      }
                      placeholder="Write your bio..."
                      rows={5}
                      required
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "11px",
                        borderRadius: "10px",
                        border:
                          "1px solid var(--border)",
                        resize: "vertical",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>

                  <label>
                    <strong>
                      Skills
                    </strong>

                    <input
                      name="skills"
                      value={
                        profileForm.skills
                      }
                      onChange={
                        handleProfileChange
                      }
                      placeholder="C, C++, JavaScript, React"
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "11px",
                        borderRadius: "10px",
                        border:
                          "1px solid var(--border)",
                        boxSizing:
                          "border-box",
                      }}
                    />

                    <small>
                      Separate skills with
                      commas.
                    </small>
                  </label>

                  <label>
                    <strong>
                      GitHub
                    </strong>

                    <input
                      name="github"
                      value={
                        profileForm.github
                      }
                      onChange={
                        handleProfileChange
                      }
                      placeholder="https://github.com/..."
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "11px",
                        borderRadius: "10px",
                        border:
                          "1px solid var(--border)",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>

                  <label>
                    <strong>
                      Email
                    </strong>

                    <input
                      name="email"
                      type="email"
                      value={
                        profileForm.email
                      }
                      onChange={
                        handleProfileChange
                      }
                      placeholder="you@example.com"
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "11px",
                        borderRadius: "10px",
                        border:
                          "1px solid var(--border)",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>

                  <label>
                    <strong>
                      Social Links
                    </strong>

                    <input
                      name="socialLinks"
                      value={
                        profileForm.socialLinks
                      }
                      onChange={
                        handleProfileChange
                      }
                      placeholder="https://..."
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "11px",
                        borderRadius: "10px",
                        border:
                          "1px solid var(--border)",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>

                  <label>
                    <strong>
                      Profile Image URL
                    </strong>

                    <input
                      name="profileImage"
                      value={
                        profileForm.profileImage
                      }
                      onChange={
                        handleProfileChange
                      }
                      placeholder="https://..."
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "11px",
                        borderRadius: "10px",
                        border:
                          "1px solid var(--border)",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>

                  <button
                    type="submit"
                    className="dark-button"
                    disabled={saving}
                    style={{
                      width: "fit-content",
                    }}
                  >
                    <Save size={16} />

                    {saving
                      ? "Saving..."
                      : "Save About Me"}
                  </button>

                </div>

              </form>

            </div>
          )}

          {/* =================================================
              DONATION
          ================================================= */}

          {section === "donation" && (
            <div className="page-stack">

              <h3>
                Donation Settings
              </h3>

              <p>
                Update the donation information
                shown on the public Donation page.
              </p>

              <form
                onSubmit={saveDonation}
                className="card"
                style={{
                  padding: "20px",
                  background: "#fffaf6",
                }}
              >

                <div
                  style={{
                    display: "grid",
                    gap: "14px",
                  }}
                >

                  <label>
                    <strong>
                      UPI ID
                    </strong>

                    <input
                      name="upiId"
                      value={
                        donationForm.upiId
                      }
                      onChange={
                        handleDonationChange
                      }
                      placeholder="yourname@upi"
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "11px",
                        borderRadius: "10px",
                        border:
                          "1px solid var(--border)",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>

                  <label>
                    <strong>
                      Donation Message
                    </strong>

                    <textarea
                      name="donationMessage"
                      value={
                        donationForm.donationMessage
                      }
                      onChange={
                        handleDonationChange
                      }
                      placeholder="Your support helps Mahei-Pathap..."
                      rows={4}
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "11px",
                        borderRadius: "10px",
                        border:
                          "1px solid var(--border)",
                        resize: "vertical",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>

                  <label>
                    <strong>
                      QR Image URL
                    </strong>

                    <input
                      name="qrImage"
                      value={
                        donationForm.qrImage
                      }
                      onChange={
                        handleDonationChange
                      }
                      placeholder="https://..."
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "11px",
                        borderRadius: "10px",
                        border:
                          "1px solid var(--border)",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="isEnabled"
                      checked={
                        donationForm.isEnabled
                      }
                      onChange={
                        handleDonationChange
                      }
                    />

                    <strong>
                      Enable donations
                    </strong>
                  </label>

                  {donationForm.qrImage && (
                    <div>
                      <strong>
                        QR Preview
                      </strong>

                      <div
                        style={{
                          marginTop: "10px",
                        }}
                      >
                        <img
                          src={
                            donationForm.qrImage
                          }
                          alt="Donation QR"
                          style={{
                            width: "180px",
                            height: "180px",
                            objectFit: "contain",
                            border:
                              "1px solid var(--border)",
                            borderRadius: "12px",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="dark-button"
                    disabled={saving}
                    style={{
                      width: "fit-content",
                    }}
                  >
                    <Save size={16} />

                    {saving
                      ? "Saving..."
                      : "Save Donation Settings"}
                  </button>

                </div>

              </form>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}