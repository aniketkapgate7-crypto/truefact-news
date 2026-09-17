import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getNewsFeed, type ApiNewsArticle } from "@/lib/api";
import { checkWorkspaceAccess } from "@/lib/workspaceAuth";
import { EditorialWorkspaceClient } from "@/components/editorial/workspace/EditorialWorkspaceClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Internal Editorial Workspace — TrueFact News",
  description: "Newsroom editorial desk, review queue, and fact-check publishing console.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WorkspacePage() {
  if (process.env.ENABLE_EDITORIAL_WORKSPACE !== "true") {
    notFound();
  }

  let userId: string | null = null;
  let getToken: () => Promise<string | null> = async () => null;
  let authContext = null;

  try {
    const authResult = await auth();
    userId = authResult.userId;
    getToken = authResult.getToken;
    authContext = { userId, getToken };
  } catch {
    // Clerk might throw if completely unconfigured
  }

  const access = await checkWorkspaceAccess(
    process.env.AUTH_ENABLED,
    process.env.ENABLE_EDITORIAL_WORKSPACE,
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    authContext
  );

  // 1. Unauthenticated view
  if (!access.granted && (access.reason === "unauthenticated" || access.reason === "missing_token")) {
    return (
      <div className="min-h-screen bg-[#07111F] text-[#E8EEF8] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-[#1E334A] bg-[#0D1B2A] p-8 text-center space-y-6 shadow-2xl">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-2xl">
            🔒
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
              NEWSROOM EDITORIAL DESK
            </span>
            <h1 className="font-serif text-2xl font-bold text-white">
              Authentication Required
            </h1>
            <p className="text-xs text-[#8191A8] leading-relaxed">
              Access to the editorial review workspace is restricted to authorized newsroom staff.
              Please sign in with your reviewer or administrator credentials to proceed.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/sign-in?redirect_url=/workspace"
              className="w-full rounded-xl bg-[#0284C7] hover:bg-[#0284C7]/90 px-4 py-3 text-xs font-bold text-white transition-colors shadow-md"
            >
              Sign In to Editorial Account
            </Link>

            <Link
              href="/"
              className="text-xs text-[#506176] hover:text-[#8191A8] transition-colors"
            >
              ← Return to Public Newsroom
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Insufficient role view (Reader account)
  if (!access.granted && access.reason === "insufficient_role") {
    return (
      <div className="min-h-screen bg-[#07111F] text-[#E8EEF8] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-red-900/60 bg-[#0D1B2A] p-8 text-center space-y-6 shadow-2xl">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-950/50 border border-red-800 text-2xl text-red-400">
            ⛔
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-red-400">
              PERMISSION DENIED: INSUFFICIENT ROLE
            </span>
            <h1 className="font-serif text-2xl font-bold text-white">
              Editorial Access Restricted
            </h1>
            <p className="text-xs text-[#8191A8] leading-relaxed">
              Your account is currently assigned the <strong>Reader</strong> role.
              Fact-check reviews, editorial queue management, and publishing controls are restricted to certified Reviewers and newsroom Administrators.
            </p>
          </div>

          <div className="rounded-lg border border-[#1E334A] bg-[#112337] p-3 text-left space-y-1 font-mono text-[11px]">
            <div className="text-[#8191A8]">
              Assigned Role: <span className="text-amber-400 font-bold">Reader</span>
            </div>
            <div className="text-[#8191A8]">
              Required Role: <span className="text-emerald-400 font-bold">Reviewer</span> or <span className="text-emerald-400 font-bold">Admin</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-block rounded-xl border border-[#1E334A] bg-[#112337] hover:bg-[#1E334A] px-5 py-2.5 text-xs font-semibold text-[#E8EEF8] transition-colors"
            >
              ← Back to Public Newsroom
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Backend or configuration error view
  if (!access.granted) {
    return (
      <div className="min-h-screen bg-[#07111F] text-[#E8EEF8] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-amber-900/60 bg-[#0D1B2A] p-8 text-center space-y-4 shadow-2xl">
          <span className="text-3xl">⚠️</span>
          <h1 className="font-serif text-xl font-bold text-white">
            Workspace Access Unavailable
          </h1>
          <p className="text-xs text-[#8191A8] leading-relaxed">
            {access.reason === "clerk_not_configured" || access.reason === "auth_disabled"
              ? "Authentication system is not configured for the editorial workspace in this environment."
              : "Unable to verify editorial credentials with backend service. Verify FastAPI is active and accessible."}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="text-xs text-[#38BDF8] hover:underline"
            >
              ← Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Access Granted (Role is Reviewer or Admin): Load articles and render Workspace
  let initialArticles: ApiNewsArticle[] = [];
  try {
    initialArticles = await getNewsFeed({
      page: 1,
      page_size: 40,
      sort_by: "published_at",
      sort_order: "desc",
    });
  } catch (err) {
    console.error("Failed to fetch initial news feed for workspace:", err);
  }

  return (
    <div className="min-h-screen bg-[#07111F] text-[#E8EEF8]">
      <EditorialWorkspaceClient
        initialArticles={initialArticles}
        userProfile={access.profile}
      />
    </div>
  );
}
