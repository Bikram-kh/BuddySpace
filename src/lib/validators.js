/* =========================================================
   PASSWORD STRENGTH VALIDATION
   ========================================================= */

/**
 * Validates password strength and returns detailed feedback
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (!@#$%^&*)
 */
export function validatePassword(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const isValid = Object.values(checks).every(Boolean);
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;

  return {
    isValid,
    passedChecks,
    totalChecks,
    strength: Math.round((passedChecks / totalChecks) * 100),
    checks,
    feedback: generateFeedback(checks),
  };
}

/**
 * Generates user-friendly feedback about password requirements
 */
function generateFeedback(checks) {
  const missing = [];

  if (!checks.length) missing.push("at least 8 characters");
  if (!checks.uppercase) missing.push("an uppercase letter");
  if (!checks.lowercase) missing.push("a lowercase letter");
  if (!checks.number) missing.push("a number");
  if (!checks.special) missing.push("a special character (!@#$%^&*)");

  if (missing.length === 0) {
    return "Password is strong ✓";
  }

  if (missing.length === 5) {
    return `Password must contain: ${missing.join(", ")}`;
  }

  return `Add: ${missing.join(", ")}`;
}

/**
 * Gets the password strength level as a string
 */
export function getPasswordStrengthLevel(strength) {
  if (strength < 20) return "Weak";
  if (strength < 40) return "Fair";
  if (strength < 60) return "Good";
  if (strength < 80) return "Strong";
  return "Very Strong";
}

/**
 * Gets color for password strength indicator
 */
export function getPasswordStrengthColor(strength) {
  if (strength < 20) return "#e74c3c"; // red
  if (strength < 40) return "#f39c12"; // orange
  if (strength < 60) return "#f1c40f"; // yellow
  if (strength < 80) return "#2ecc71"; // green
  return "#27ae60"; // dark green
}

/**
 * Validates email format (basic validation)
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates that passwords match
 */
export function validatePasswordMatch(password, confirmPassword) {
  return password === confirmPassword && password.length > 0;
}

/**
 * Validates signup form
 */
export function validateSignupForm(formData) {
  const errors = {};

  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = "Full name is required";
  }

  if (!formData.email || formData.email.trim().length === 0) {
    errors.email = "Email is required";
  } else if (!validateEmail(formData.email)) {
    errors.email = "Please enter a valid email address";
  }

  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.feedback;
  }

  if (!formData.confirmPassword || formData.confirmPassword.length === 0) {
    errors.confirmPassword = "Please confirm your password";
  } else if (!validatePasswordMatch(formData.password, formData.confirmPassword)) {
    errors.confirmPassword = "Passwords do not match";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
