import { isClerkAPIResponseError } from "@clerk/expo";

/**
 * Maps backend/auth errors to short, product copy (no vendor branding).
 */
export function mapAuthError(error: unknown): string {
  if (error == null) return "Something went wrong. Try again.";
  if (typeof error === "object" && error !== null && "clerkError" in error) {
    const clerkErr = error as {
      longMessage?: string;
      message?: string;
    };
    if (isClerkAPIResponseError(error) && error.errors?.length) {
      const first = error.errors[0];
      return (
        first.longMessage?.trim() ||
        first.message?.trim() ||
        clerkErr.longMessage?.trim() ||
        clerkErr.message?.trim() ||
        "Something went wrong. Try again."
      );
    }
    return (
      clerkErr.longMessage?.trim() ||
      clerkErr.message?.trim() ||
      "Something went wrong. Try again."
    );
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return "Something went wrong. Try again.";
}
