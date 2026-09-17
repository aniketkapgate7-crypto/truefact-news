import React from "react";
import { ClerkProvider } from "@clerk/nextjs";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const authEnabled = process.env.AUTH_ENABLED === "true";

  if (!authEnabled || !publishableKey || !publishableKey.trim()) {
    // When authentication is disabled or Clerk publishable key is not configured,
    // pass through children safely without throwing
    return <>{children}</>;
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
      {children}
    </ClerkProvider>
  );
}
