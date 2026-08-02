// src/supabase/SupabaseProvider.tsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import { getSupabase } from "../supabase/supabaseClient";
import axiosInstance, { getCompanyId } from "../utils/axiosConfig";

type CompanyId = "company-a" | "company-b";

interface SupabaseContext {
  supabase: SupabaseClient;
  session: Session | null;
  ready: boolean;
  setCompany: (id: CompanyId) => void;
}

const Ctx = createContext<SupabaseContext | null>(null);

export function useSupabase(): SupabaseContext {
  const ctx = useContext(Ctx);
  if (ctx == null)
    throw new Error("useSupabase must be used inside <SupabaseProvider>");
  return ctx;
}

export function SupabaseProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [, setCompany] = useState<CompanyId>(() => getCompanyId() as CompanyId);
  const [supabase] = useState<SupabaseClient>(() => getSupabase()); // Single instance
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  /* switch company context (no need to rebuild client) */
  const switchCompany = useCallback((id: CompanyId) => {
    localStorage.setItem("companyId", id);
    setCompany(id);
    // No need to rebuild client - single instance handles all companies
  }, []);

  /* hydrate session + attach token listener */
  useEffect(() => {
    let unsub: () => void;

    const bootstrap = async (): Promise<void> => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setReady(true);

      unsub = supabase.auth.onAuthStateChange((_e, s) => {
        setSession(s);
      }).data.subscription.unsubscribe;
    };

    void bootstrap(); // purposely ignore the Promise here

    return () => {
      unsub?.();
    };
  }, [supabase]);

  /* push / clear Authorization header whenever session changes */
  useEffect(() => {
    if (session?.access_token != null) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${session.access_token}`;
    } else {
      delete axiosInstance.defaults.headers.common.Authorization;
    }
  }, [session]);

  return (
    <Ctx.Provider
      value={{ supabase, session, ready, setCompany: switchCompany }}
    >
      {children}
    </Ctx.Provider>
  );
}
