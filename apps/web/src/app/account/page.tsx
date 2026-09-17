import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { getAuthenticatedUserProfile } from "@/lib/api";

export default async function AccountPage() {
  const isClerkConfigured =
    typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.trim().length > 0;

  if (!isClerkConfigured) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
        <EditorialHeader />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-8 text-center shadow-sm">
            <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Account Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Authentication is currently disabled in this environment. All news, credibility assessments, and public claim tools are freely accessible.
            </p>
          </div>
        </main>
        <EditorialFooter />
      </div>
    );
  }

  const { userId, getToken } = await auth();
  const user = await currentUser();

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
        <EditorialHeader />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-8 text-center shadow-sm">
            <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Sign In to Your Account
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              Sign in to manage your TrueFact News account profile and editorial credentials.
            </p>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-lg bg-[#E5242A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c9181e] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </main>
        <EditorialFooter />
      </div>
    );
  }

  // Obtain backend token and resolve database-authoritative profile & role
  const token = await getToken();
  const backendProfile = token ? await getAuthenticatedUserProfile(token) : null;

  const role = backendProfile?.role ?? "reader";
  const isActive = backendProfile?.is_active ?? true;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
      <EditorialHeader />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {/* Header Title */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#E5242A]">
            Account & Identity
          </span>
          <h1 className="font-serif text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
            Account Profile
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Authenticated profile and backend-authoritative permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity Card */}
          <div className="md:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Profile Details
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Name</span>
                <span className="text-gray-900 dark:text-gray-100 font-semibold">
                  {user?.fullName || backendProfile?.display_name || "Reader"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Email Address</span>
                <span className="text-gray-900 dark:text-gray-100 font-mono text-xs sm:text-sm">
                  {user?.primaryEmailAddress?.emailAddress || backendProfile?.email || "—"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Account Subject</span>
                <span className="text-gray-500 dark:text-gray-400 font-mono text-xs truncate max-w-[260px]">
                  {userId}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between py-2">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Account Status</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                  isActive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                  {isActive ? "Active" : "Deactivated"}
                </span>
              </div>
            </div>
          </div>

          {/* Authorization & Role Card */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Application Role
              </h2>

              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                  role === "admin"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                    : role === "reviewer"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                }`}>
                  {role}
                </span>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {role === "admin"
                  ? "Administrator with platform management and content authorization access."
                  : role === "reviewer"
                  ? "Editorial desk reviewer authorized to review, verify, and publish fact-checks."
                  : "Standard reader with full access to news, transparent credibility evidence, and verification tools."}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">
                Authority Record
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                Authoritative role governed by PostgreSQL backend.
              </span>
            </div>
          </div>
        </div>
      </main>
      <EditorialFooter />
    </div>
  );
}
