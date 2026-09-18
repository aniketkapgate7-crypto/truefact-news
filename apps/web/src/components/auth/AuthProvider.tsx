import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { DisabledAuthProvider } from "./DisabledAuthProvider";
import { ClerkAuthProviderBridge } from "./ClerkAuthProviderBridge";
import { isAuthEnabled } from "@/lib/authConfig";

export { useAppAuth } from "./AuthContext";
export type { AppAuthContextType } from "./AuthContext";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const enabled = isAuthEnabled();

  if (!enabled || !publishableKey || !publishableKey.trim()) {
    // When authentication is disabled or Clerk publishable key is not configured,
    // do not instantiate ClerkProvider and provide a safe disabled auth context
    return <DisabledAuthProvider>{children}</DisabledAuthProvider>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        variables: {
          colorPrimary: "#E5242A",
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          borderRadius: "0.375rem",
        },
      }}
    >
      <ClerkAuthProviderBridge>{children}</ClerkAuthProviderBridge>
    </ClerkProvider>
  );
}
