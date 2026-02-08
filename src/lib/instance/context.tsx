"use client";

import { createContext, useContext } from "react";
import type { Instance, InstanceRole } from "./types";

type InstanceContextValue = {
  instance: Instance;
  role: InstanceRole;
  slug: string;
};

const InstanceContext = createContext<InstanceContextValue | null>(null);

export function InstanceProvider({
  children,
  instance,
  role,
}: {
  children: React.ReactNode;
  instance: Instance;
  role: InstanceRole;
}) {
  return (
    <InstanceContext.Provider value={{ instance, role, slug: instance.slug }}>
      {children}
    </InstanceContext.Provider>
  );
}

export function useInstance() {
  const ctx = useContext(InstanceContext);
  if (!ctx) throw new Error("useInstance must be used within InstanceProvider");
  return ctx;
}

export function useInstanceSlug() {
  return useInstance().slug;
}
