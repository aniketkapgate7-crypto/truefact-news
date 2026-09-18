/**
 * Authoritative check for whether authentication is enabled in the current environment.
 * Requires both AUTH_ENABLED to be explicitly "true" and a non-empty Clerk publishable key.
 */
export function isAuthEnabled(): boolean {
  return (
    process.env.AUTH_ENABLED === "true" &&
    typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.trim().length > 0
  );
}
