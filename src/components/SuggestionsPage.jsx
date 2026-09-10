import React, { useState } from "react";
import { ID } from "appwrite";
import { Send, Lightbulb, CheckCircle2, User, MessageSquare } from "lucide-react";
import {
  databases,
  APPWRITE_DATABASE_ID,
  APPWRITE_SUGGESTIONS_COLLECTION_ID,
  isAppwriteConfigured,
} from "../lib/appwrite";

export default function SuggestionsPage({ authUser, userName }) {
  const [suggestion, setSuggestion] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitState, setSubmitState] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!suggestion.trim()) {
      setError("Please enter a suggestion.");
      return;
    }

    setSubmitState("submitting");
    setError("");

    try {
      if (isAppwriteConfigured && authUser) {
        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_SUGGESTIONS_COLLECTION_ID,
          ID.unique(),
          {
            suggestion: suggestion.trim(),
            isAnonymous,
            userId: authUser.$id,
            userName: isAnonymous ? "" : (authUser.name || userName),
            userEmail: isAnonymous ? "" : (authUser.email || ""),
            status: "New",
            createdAt: new Date().toISOString(),
          }
        );
      } else if (isAppwriteConfigured) {
        setError("Please sign in to submit a suggestion.");
        setSubmitState("idle");
        return;
      } else {
        setError("Appwrite is not configured.");
        setSubmitState("idle");
        return;
      }

      setSubmitState("success");
      setSuggestion("");
      setIsAnonymous(false);
    } catch (err) {
      setError(err.message || "Failed to submit suggestion.");
      setSubmitState("idle");
    }
  };

  if (submitState === "success") {
    return (
      <div className="page-stack">
        <section className="card suggestion-success">
          <CheckCircle2 size={38} className="success-icon" />
          <h3>Thanks!</h3>
          <p>Your suggestion has been sent to the Mahei-Pathap team.</p>
          <button className="secondary-button suggestion-resubmit" onClick={() => setSubmitState("idle")}>
            Send another suggestion
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="card">
        <div className="suggestion-header">
          <div className="section-title">
            <div className="section-dot purple" />
            <h3><Lightbulb size={18} /> Suggestion Box</h3>
          </div>
        </div>

        <p className="suggestion-intro">
          Have an idea to make Mahei-Pathap better? Share your feedback with us!
        </p>

        <form className="suggestion-form" onSubmit={handleSubmit}>
          <label className="field-group">
            Your suggestion
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Share your idea for improving Mahei-Pathap..."
              rows={5}
              maxLength={1000}
              className="suggestion-textarea"
            />
          </label>

          <div className="anon-toggle">
            <span className="anon-toggle-label">Submit as:</span>
            <div className="anon-toggle-group">
              <button
                type="button"
                className={`anon-toggle-item ${!isAnonymous ? "selected" : ""}`}
                onClick={() => setIsAnonymous(false)}
                aria-label="Submit with your name"
              >
                <User size={16} /> My Name
              </button>
              <button
                type="button"
                className={`anon-toggle-item ${isAnonymous ? "selected" : ""}`}
                onClick={() => setIsAnonymous(true)}
                aria-label="Submit anonymously"
              >
                <MessageSquare size={16} /> Anonymous
              </button>
            </div>
          </div>

          {error && <p className="suggestion-error">{error}</p>}

          <button
            type="submit"
            className="primary-button purple full-width suggestion-submit"
            disabled={submitState === "submitting"}
          >
            <Send size={16} />
            {submitState === "submitting" ? "Sending..." : "Submit suggestion"}
          </button>
        </form>
      </section>
    </div>
  );
}