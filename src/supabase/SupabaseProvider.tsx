// src/supabase/SupabaseProvider.tsx   (replace old file)

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabaseClient";
import { getCompanyId } from "../utils/axiosConfig";

type CompanyId = "company-a" | "company-b";

interface Ctx {
  supabase: SupabaseClient;
  session: Session | null;
  /** change active company (re-creates the client) */
  setCompany: (id: CompanyId) => void;
}

const AuthCtx = createContext<Ctx | null>(null);
export const useSupabase = () => useContext(AuthCtx)!;

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<CompanyId | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  /* ── initialise from cookie / localStorage once ── */
  useEffect(() => {
    setCompany(getCompanyId() as CompanyId);
  }, []);

  /* ── whenever company changes → build new client & re-attach listener ── */
  useEffect(() => {
    if (!company) return;

    const sb = getSupabase(company);
    setSupabase(sb);

    // initial session
    sb.auth.getSession().then(({ data }) => setSession(data.session));

    // listener
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_e, s) => setSession(s));

    return () => subscription.unsubscribe();
  }, [company]);

  /* expose a stable setter so children can switch company */
  const switchCompany = useCallback((id: CompanyId) => {
    localStorage.setItem("companyId", id); // keep behaviour
    setCompany(id);
  }, []);

  if (!supabase) return null; // SSR pass

  return (
    <AuthCtx.Provider value={{ supabase, session, setCompany: switchCompany }}>
      {children}
    </AuthCtx.Provider>
  );
}
