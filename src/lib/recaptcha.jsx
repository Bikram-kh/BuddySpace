import React from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

/**
 * This component wraps the app with reCAPTCHA v3 provider
 * 
 * reCAPTCHA v3 silently scores users without interrupting UX
 * Score ranges from 0.0 (bot) to 1.0 (human)
 * 
 * To use:
 * 1. Get your site key from: https://www.google.com/recaptcha/admin
 * 2. Add to .env: VITE_RECAPTCHA_SITE_KEY=your_key_here
 * 3. In signup/login, call executeRecaptcha('signup') or ('login')
 * 4. Send token to backend for verification
 */

export function AppWithRecaptcha({ children }) {
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

  if (!recaptchaSiteKey) {
    console.warn(
      "reCAPTCHA site key not configured. Please add VITE_RECAPTCHA_SITE_KEY to .env"
    );
    return children;
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
      {children}
    </GoogleReCaptchaProvider>
  );
}

/**
 * Hook to use reCAPTCHA in components
 * 
 * Usage:
 * const { executeRecaptcha } = useGoogleReCaptcha();
 * const token = await executeRecaptcha('signup');
 */
export { useGoogleReCaptcha } from "react-google-recaptcha-v3";
