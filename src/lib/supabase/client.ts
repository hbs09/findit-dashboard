"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton para componentes client
let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
