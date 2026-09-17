import { getAuthenticatedUserProfile, type ApiUser } from "@/lib/api";

export type WorkspaceAccessResult =
  | {
      granted: false;
      reason:
        | "workspace_disabled"
        | "clerk_not_configured"
        | "auth_disabled"
        | "unauthenticated"
        | "missing_token"
        | "insufficient_role"
        | "backend_error";
    }
  | {
      granted: true;
      profile: ApiUser;
    };

export async function checkWorkspaceAccess(
  authEnabled: string | undefined,
  workspaceEnabled: string | undefined,
  clerkKey: string | undefined,
  authContext: { userId: string | null; getToken: () => Promise<string | null> } | null
): Promise<WorkspaceAccessResult> {
  if (workspaceEnabled !== "true") {
    return { granted: false, reason: "workspace_disabled" };
  }

  if (typeof clerkKey !== "string" || clerkKey.trim().length === 0) {
    return { granted: false, reason: "clerk_not_configured" };
  }

  if (authEnabled !== "true") {
    return { granted: false, reason: "auth_disabled" };
  }

  if (!authContext || !authContext.userId) {
    return { granted: false, reason: "unauthenticated" };
  }

  const token = await authContext.getToken();
  if (!token) {
    return { granted: false, reason: "missing_token" };
  }

  try {
    const profile = await getAuthenticatedUserProfile(token);
    if (!profile || !profile.is_active || (profile.role !== "reviewer" && profile.role !== "admin")) {
      return { granted: false, reason: "insufficient_role" };
    }
    return { granted: true, profile };
  } catch {
    return { granted: false, reason: "backend_error" };
  }
}
