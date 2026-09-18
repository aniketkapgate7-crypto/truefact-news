"use client";

import type { ReactNode } from "react";
import { AuthContext, disabledAuthValue } from "./AuthContext";

export function DisabledAuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={disabledAuthValue}>{children}</AuthContext.Provider>;
}
