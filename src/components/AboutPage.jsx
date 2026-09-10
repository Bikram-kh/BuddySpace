import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Link2,
  Github,
  MapPin,
  Building,
  Sparkles,
} from "lucide-react";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PROFILE_SETTINGS_COLLECTION_ID, isAppwriteConfigured } from "../lib/appwrite";

export default function AboutPage({ userName, authUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!isAppwriteConfigured) {
        setError("Appwrite is not configured.");
        setLoading(false);
        return;
      }

      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_PROFILE_SETTINGS_COLLECTION_ID
        );

        if (mounted) {
          setProfile(response.documents[0] || null);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError("Unable to load profile.");
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="empty-state"><span>⏳</span><p>Loading profile...</p></div>;
  }

  if (error && !profile) {
    return <div className="empty-state"><span>⚠️</span><p>{error}</p></div>;
  }

  if (!profile) {
    return <div className="empty-state"><span>👋</span><p>No profile set up yet.</p></div>;
  }

  const skills = Array.isArray(profile.skills) ? profile.skills : [];

  return (
    <div className="page-stack">
      <section className="card about-card">
        <div className="about-hero">
          <div className="about-photo">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt={profile.name || userName} />
            ) : (
              <div className="about-photo-placeholder">👤</div>
            )}
          </div>

          <div className="about-info">
            <span className="eyebrow">
              <Sparkles size={13} />
              About Me
            </span>

            <h2>{profile.name || userName || "Mahei-Pathap Developer"}</h2>

            <p className="about-bio">{profile.bio || "Building Mahei-Pathap with love for students."}</p>

            {profile.role && (
              <div className="about-meta">
                <Building size={14} />
                {profile.role}
              </div>
            )}

            {profile.location && (
              <div className="about-meta">
                <MapPin size={14} />
                {profile.location}
              </div>
            )}
          </div>
        </div>

        {profile.skills && skills.length > 0 && (
          <div className="about-section">
            <h3>Skills</h3>
            <div className="about-skills">
              {skills.map((skill, index) => (
                <span key={index} className="about-skill">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {(profile.github || profile.email || profile.socialLinks) && (
          <div className="about-section">
            <h3>Connect</h3>
            <div className="about-links">
              {profile.github && (
                <a className="about-link" href={profile.github} target="_blank" rel="noopener noreferrer">
                  <Github size={15} />
                  GitHub
                </a>
              )}

              {profile.email && (
                <a className="about-link" href={`mailto:${profile.email}`}>
                  <Mail size={15} />
                  {profile.email}
                </a>
              )}

              {profile.socialLinks && (
                <a className="about-link" href={profile.socialLinks} target="_blank" rel="noopener noreferrer">
                  <Link2 size={15} />
                  More links
                </a>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}