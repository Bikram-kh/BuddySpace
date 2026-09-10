import React, { useEffect, useState } from "react";
import { Heart, Copy, Check, ExternalLink } from "lucide-react";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_DONATION_SETTINGS_COLLECTION_ID, isAppwriteConfigured } from "../lib/appwrite";

export default function DonationPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [copied, setCopied] = useState(false);

  const quickAmounts = [10, 50, 100, 500];

  useEffect(() => {
    const loadSettings = async () => {
      if (!isAppwriteConfigured) {
        setError("Appwrite is not configured.");
        setLoading(false);
        return;
      }

      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_DONATION_SETTINGS_COLLECTION_ID
        );

        setSettings(response.documents[0] || null);
        setLoading(false);
      } catch (err) {
        setError("Unable to load donation settings.");
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setCustomAmount(value);
      setSelectedAmount(0);
    }
  };

  const getAmount = () => {
    if (selectedAmount > 0) return selectedAmount;
    if (customAmount && parseInt(customAmount) > 0) return parseInt(customAmount);
    return 0;
  };

  const handleDonate = () => {
    const amount = getAmount();
    if (amount === 0) {
      alert("Please select or enter a donation amount.");
      return;
    }

    if (!settings?.upiId) {
      alert("UPI ID is not configured yet.");
      return;
    }

    const upiUri = `upi://pay?pa=${settings.upiId}&am=${amount}&cu=INR&tn=Donation%20to%20Mahei-Pathap`;
    window.open(upiUri, "_blank");
  };

  const handleCopyUpi = () => {
    if (settings?.upiId) {
      navigator.clipboard.writeText(settings.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="empty-state"><span>⏳</span><p>Loading donation info...</p></div>;
  }

  if (error) {
    return <div className="empty-state"><span>⚠️</span><p>{error}</p></div>;
  }

  return (
    <div className="page-stack donation-page">
      <section className="card">
        <div className="donation-header">
          <Heart size={28} className="donation-icon" />
          <h2>Support Mahei-Pathap</h2>
          <p className="donation-subtitle">
            {settings?.donationMessage || "Your support helps us keep improving Mahei-Pathap for students."}
          </p>
        </div>

        {settings?.qrImage && (
          <div className="donation-qr">
            <img src={settings.qrImage} alt="UPI QR Code" />
            <p className="qr-label">Scan to donate</p>
          </div>
        )}

        <div className="donation-upi">
          <span className="upi-label">UPI ID</span>
          <div className="upi-row">
            <code className="upi-id-code">{settings?.upiId || "Not configured"}</code>
            {settings?.upiId && (
              <button className="copy-upi-button" onClick={handleCopyUpi}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span className="copy-tooltip">{copied ? "Copied ✓" : "Copy"}</span>
              </button>
            )}
          </div>
          {copied && <span className="copy-feedback">Copied!</span>}
        </div>

        <div className="donation-amount">
          <h4>Choose amount (₹)</h4>
          <div className="amount-grid">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                className={`amount-button ${selectedAmount === amount ? "selected" : ""}`}
                onClick={() => handleAmountSelect(amount)}
              >
                ₹{amount}
              </button>
            ))}
          </div>
          <div className="custom-amount">
            <span className="currency-symbol">₹</span>
            <input
              type="text"
              placeholder="Custom amount"
              value={customAmount}
              onChange={handleCustomAmountChange}
              className="custom-amount-input"
            />
          </div>
        </div>

        <button
          className="dark-button large full-width donate-upi-button"
          onClick={handleDonate}
          disabled={!settings?.upiId}
        >
          <Heart size={18} />
          Donate via UPI
          <ExternalLink size={16} />
        </button>

        {!settings?.upiId && (
          <p className="donation-warning">
            ⚠️ UPI ID is not configured. Please contact the admin.
          </p>
        )}
      </section>
    </div>
  );
}