const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "Enter your email address.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(raw: string): string | null {
  if (!raw) return "Enter your password.";
  if (raw.length < 8) return "Use at least 8 characters.";
  return null;
}

export function validatePasswordConfirm(
  password: string,
  confirm: string,
): string | null {
  if (password !== confirm) return "Passwords do not match.";
  return null;
}
