"use client";

import { createContext, useContext } from "react";

export interface AppAuthContextType {
  isAuthEnabled: boolean;
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  getToken: () => Promise<string | null>;
}

export const disabledAuthValue: AppAuthContextType = {
  isAuthEnabled: false,
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  getToken: async () => null,
};

export const AuthContext = createContext<AppAuthContextType>(disabledAuthValue);

export function useAppAuth(): AppAuthContextType {
  return useContext(AuthContext);
}
