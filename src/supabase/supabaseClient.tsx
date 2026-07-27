// supabase/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type CompanyId = "company-a" | "company-b";

// Single Supabase configuration (migrated from multi-company)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL_A; // Using company-a as the single instance
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_A;

// Single Supabase client instance
let supabaseInstance: SupabaseClient | null = null;

// Browser-safe storage implementation
const browserStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
  },
};

export function getSupabase(): SupabaseClient {
  if (supabaseInstance === null) {
    if (
      SUPABASE_URL === undefined ||
      SUPABASE_KEY === undefined ||
      SUPABASE_URL === "" ||
      SUPABASE_KEY === ""
    ) {
      throw new Error("Missing Supabase configuration");
    }

    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "sb-auth-token", // Single storage key
        storage: browserStorage,
      },
      global: {
        headers: {
          "X-Client-Info": "scs-fe/next",
        },
      },
    });

    // Log client creation in development
    if (process.env.NODE_ENV !== "production") {
      console.log("Created single Supabase client instance");
    }
  }

  return supabaseInstance;
}

// Add helpers for common auth operations
export const authHelpers = {
  // Refresh session and handle errors
  refreshSession: async (): Promise<boolean> => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.refreshSession();

      if (error !== null) {
        console.error("Session refresh failed:", error);
        return false;
      }

      return data.session !== null;
    } catch (e) {
      console.error("Error refreshing session:", e);
      return false;
    }
  },

  // Sign out from single Supabase instance
  signOut: async (): Promise<void> => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      localStorage.removeItem("sb-auth-token");
      localStorage.removeItem("companyId");
    } catch (e) {
      console.error("Error signing out:", e);
    }

    // Clear the singleton instance
    supabaseInstance = null;
  },

  // Get current active session
  getCurrentSession: async (): Promise<{
    company: CompanyId;
    session: any;
  } | null> => {
    if (typeof window === "undefined") return null;

    const companyId = localStorage.getItem("companyId");
    const currentCompany =
      companyId !== null && companyId !== ""
        ? (companyId as CompanyId)
        : "company-a";

    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();

      if (data.session !== null) {
        return { company: currentCompany, session: data.session };
      }

      return null;
    } catch (e) {
      console.error("Error getting current session:", e);
      return null;
    }
  },
};
