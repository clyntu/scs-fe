// utils/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type CompanyId = "company-a" | "company-b";

const URLS: Record<CompanyId, string> = {
  "company-a": process.env.NEXT_PUBLIC_SUPABASE_URL_A!,
  "company-b": process.env.NEXT_PUBLIC_SUPABASE_URL_B!,
};
const KEYS: Record<CompanyId, string> = {
  "company-a": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_A!,
  "company-b": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_B!,
};

/** cache so we never create two clients for the same company on the same tab */
const cache: Partial<Record<CompanyId, SupabaseClient>> = {};

export function getSupabase(company: CompanyId): SupabaseClient {
  if (!cache[company]) {
    cache[company] = createClient(URLS[company], KEYS[company], {
      auth: {
        // v2 names: persistSession / autoRefreshToken are now booleans under auth
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: { "X-Client-Info": `scs-fe/next` }, // optional: custom header
      },
    });
  }
  return cache[company];
}
