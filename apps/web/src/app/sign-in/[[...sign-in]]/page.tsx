import { SignIn } from "@clerk/nextjs";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { isAuthEnabled } from "@/lib/authConfig";

export default function SignInPage() {
  const enabled = isAuthEnabled();

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
      <EditorialHeader />
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        {enabled ? (
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
          />
        ) : (
          <div className="max-w-md w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-8 text-center shadow-sm">
            <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Authentication Disabled
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              User sign-in is not configured in this environment. Public news, evidence ratings, and verification features remain freely accessible.
            </p>
          </div>
        )}
      </main>
      <EditorialFooter />
    </div>
  );
}
