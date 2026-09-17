"use client";

import { useMemo, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { AuthContext, type AppAuthContextType } from "./AuthContext";

export function ClerkAuthProviderBridge({ children }: { children: ReactNode }) {
  const clerkAuth = useAuth();

  const value: AppAuthContextType = useMemo(
    () => ({
      isAuthEnabled: true,
      isLoaded: clerkAuth.isLoaded,
      isSignedIn: Boolean(clerkAuth.isSignedIn),
      userId: clerkAuth.userId ?? null,
      getToken: clerkAuth.getToken,
    }),
    [clerkAuth.isLoaded, clerkAuth.isSignedIn, clerkAuth.userId, clerkAuth.getToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
