"use client";

import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

export function UserNavControl() {
  const isClerkConfigured =
    typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.trim().length > 0;

  if (!isClerkConfigured) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <SignedOut>
        <SignInButton mode="modal">
          <button
            type="button"
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors hover:border-gray-400 hover:text-black dark:hover:text-white"
          >
            Sign In
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <Link
          href="/account"
          className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Account
        </Link>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-7 h-7 border border-gray-300 dark:border-gray-700",
            },
          }}
        />
      </SignedIn>
    </div>
  );
}
