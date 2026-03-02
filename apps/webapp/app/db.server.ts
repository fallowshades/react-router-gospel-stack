import { remember } from "@epic-web/remember";

import { createClient } from "@Hamoria/infrastructure/database";

import { env } from "./env.server";

export const db = remember("db", () => {
  return createClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
    syncUrl: env.DATABASE_SYNC_URL,
  });
});
