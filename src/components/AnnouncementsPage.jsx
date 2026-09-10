import React, { useEffect, useState } from "react";
import { ID } from "appwrite";
import { Megaphone, X, TriangleAlert, Info, BellRing, CalendarDays } from "lucide-react";
import {
  databases,
  APPWRITE_DATABASE_ID,
  APPWRITE_ANNOUNCEMENTS_COLLECTION_ID,
  APPWRITE_ANNOUNCEMENT_DISMISSALS_COLLECTION_ID,
  isAppwriteConfigured,
  Query,
} from "../lib/appwrite";

function getPriorityClass(priority) {
  if (priority === "urgent") return "urgent";
  if (priority === "important") return "important";
  return "normal";
}

function getPriorityIcon(priority) {
  if (priority === "urgent") return <TriangleAlert size={16} />;
  if (priority === "important") return <BellRing size={16} />;
  return <Info size={16} />;
}

function getPriorityLabel(priority) {
  if (priority === "urgent") return "Urgent";
  if (priority === "important") return "Important";
  return "Normal";
}

function isAnnouncementActive(announcement) {
  const now = Date.now();
  const expires = announcement.expiresAt ? new Date(announcement.expiresAt).getTime() : Infinity;
  return now < expires;
}

function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function AnnouncementsPage({ authUser }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState({});

  useEffect(() => {
    let mounted = true;

    const loadAnnouncements = async () => {
      if (!isAppwriteConfigured) return;

      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_ANNOUNCEMENTS_COLLECTION_ID
        );

        if (!mounted) return;

        const active = response.documents.filter(isAnnouncementActive);
        active.sort((a, b) => {
          const order = { urgent: 0, important: 1, normal: 2 };
          const aOrder = order[a.priority] ?? 3;
          const bOrder = order[b.priority] ?? 3;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        setAnnouncements(active);

        if (authUser) {
          try {
            const dismissals = await databases.listDocuments(
              APPWRITE_DATABASE_ID,
              APPWRITE_ANNOUNCEMENT_DISMISSALS_COLLECTION_ID,
              [Query.equal("userId", authUser.$id)]
            );

            if (!mounted) return;

            const map = {};
            dismissals.documents.forEach((d) => {
              map[d.announcementId] = true;
            });
            setDismissed(map);
          } catch {
            setDismissed({});
          }
        }
      } catch {
        if (mounted) setError("Unable to load announcements.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAnnouncements();

    return () => {
      mounted = false;
    };
  }, [authUser]);

  const dismissAnnouncement = async (announcementId) => {
    setDismissed((prev) => ({ ...prev, [announcementId]: true }));

    if (!isAppwriteConfigured || !authUser) return;

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ANNOUNCEMENT_DISMISSALS_COLLECTION_ID,
        ID.unique(),
        {
          announcementId,
          userId: authUser.$id,
          dismissedAt: new Date().toISOString(),
        }
      );
    } catch {
      setDismissed((prev) => ({ ...prev, [announcementId]: false }));
    }
  };

  const visibleAnnouncements = announcements.filter((a) => !dismissed[a.$id]);

  if (loading) {
    return <div className="empty-state"><span>⏳</span><p>Loading announcements...</p></div>;
  }

  if (error) {
    return <div className="empty-state"><span>⚠️</span><p>{error}</p></div>;
  }

  return (
    <div className="page-stack">
      <div className="announcements-page">
        <div className="announcements-header">
          <div className="section-title">
            <div className="section-dot orange" />
            <h3><Megaphone size={18} /> Announcements</h3>
          </div>
          <p className="announcements-intro">
            Stay updated with the latest news and important updates from Mahei-Pathap.
          </p>
        </div>

        {visibleAnnouncements.length === 0 ? (
          <div className="announcement-empty card">
            <div className="announcement-empty-icon">
              <Megaphone size={32} />
            </div>
            <h4>No announcements yet</h4>
            <p>We'll let you know when something important comes up.</p>
          </div>
        ) : (
          <div className="announcements-list">
            {visibleAnnouncements.map((announcement) => (
              <div
                key={announcement.$id}
                className={`announcement-card priority-${getPriorityClass(announcement.priority)}`}
              >
                <button
                  className="announcement-dismiss-btn"
                  onClick={() => dismissAnnouncement(announcement.$id)}
                  aria-label="Dismiss announcement"
                >
                  <X size={16} />
                </button>

                <div className="announcement-content">
                  <div className="announcement-header">
                    <div className="announcement-title">
                      <span className={`announcement-icon priority-${getPriorityClass(announcement.priority)}`}>
                        {getPriorityIcon(announcement.priority)}
                      </span>
                      <strong>{announcement.title || "Announcement"}</strong>
                    </div>

                    <span className={`priority-badge ${getPriorityClass(announcement.priority)}`}>
                      {getPriorityLabel(announcement.priority)}
                    </span>
                  </div>

                  <p className="announcement-message">
                    {announcement.message || ""}
                  </p>

                  {announcement.createdAt && (
                    <span className="announcement-date">
                      <CalendarDays size={13} />
                      {formatDateTime(announcement.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}