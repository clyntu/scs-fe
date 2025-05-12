// supabase/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type CompanyId = "company-a" | "company-b";

const URLS: Record<CompanyId, string> = {
  "company-a": process.env.NEXT_PUBLIC_SUPABASE_URL_A!,
  "company-b": process.env.NEXT_PUBLIC_SUPABASE_URL_B!,
};
const KEYS: Record<CompanyId, string> = {
  "company-a": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_A!,
  "company-b": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_B!,
};

// Cache so we never create two clients for the same company on the same tab
const cache: Partial<Record<CompanyId, SupabaseClient>> = {};

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

export function getSupabase(company: CompanyId): SupabaseClient {
  if (!cache[company]) {
    if (!URLS[company] || !KEYS[company]) {
      console.error(`Missing Supabase configuration for ${company}`);

      // Fallback to company-a if configuration is missing
      if (company !== "company-a" && URLS["company-a"] && KEYS["company-a"]) {
        company = "company-a";
      } else {
        throw new Error(`Cannot initialize Supabase client for ${company}`);
      }
    }

    cache[company] = createClient(URLS[company], KEYS[company], {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: `sb-${company}-auth-token`,
        storage: browserStorage,
      },
      global: {
        headers: {
          "X-Client-Info": `scs-fe/next`,
          // Add company ID to all Supabase requests as well
          "X-Company-ID": company,
        },
      },
    });

    // Log client creation in development
    if (process.env.NODE_ENV !== "production") {
      console.log(`Created Supabase client for ${company}`);
    }
  }

  return cache[company];
}

// Add helpers for common auth operations
export const authHelpers = {
  // Refresh session and handle errors
  refreshSession: async (company: CompanyId): Promise<boolean> => {
    try {
      const supabase = getSupabase(company);
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error(`Session refresh failed for ${company}:`, error);
        return false;
      }

      return !!data.session;
    } catch (e) {
      console.error(`Error refreshing session for ${company}:`, e);
      return false;
    }
  },

  // Sign out from all companies
  signOutAll: async (): Promise<void> => {
    const companies: CompanyId[] = ["company-a", "company-b"];

    for (const company of companies) {
      try {
        const supabase = getSupabase(company);
        await supabase.auth.signOut();
        localStorage.removeItem(`sb-${company}-auth-token`);
      } catch (e) {
        console.error(`Error signing out from ${company}:`, e);
      }
    }

    // Clear the cache after signing out
    Object.keys(cache).forEach((key) => {
      delete cache[key as CompanyId];
    });
  },

  // Get current company's active session
  getCurrentSession: async (): Promise<{
    company: CompanyId;
    session: any;
  } | null> => {
    if (typeof window === "undefined") return null;

    const companyId =
      (localStorage.getItem("companyId") as CompanyId) || "company-a";

    try {
      const supabase = getSupabase(companyId);
      const { data } = await supabase.auth.getSession();

      if (data?.session) {
        return { company: companyId, session: data.session };
      }

      return null;
    } catch (e) {
      console.error("Error getting current session:", e);
      return null;
    }
  },
};
