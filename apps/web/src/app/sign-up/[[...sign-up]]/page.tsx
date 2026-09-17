import { SignUp } from "@clerk/nextjs";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export default function SignUpPage() {
  const isClerkConfigured =
    typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
      <EditorialHeader />
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        {isClerkConfigured ? (
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
          />
        ) : (
          <div className="max-w-md w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-8 text-center shadow-sm">
            <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Registration Disabled
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              User registration is not configured in this environment. Public news, evidence ratings, and verification features remain freely accessible.
            </p>
          </div>
        )}
      </main>
      <EditorialFooter />
    </div>
  );
}
