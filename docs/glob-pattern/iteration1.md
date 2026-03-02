#

##

###

1. 
2. 

####

# 1. Clear pnpm cache (stuck downloads)
pnpm store prune

# 2. Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install --frozen-lockfile=false

#### we pick turso with drizzle, programmatic update

turbo/generators

[packages] https://turborepo.dev/docs/guides/generating-code

add-internal-package.ts

[set-generator] https://rebeccamdeprey.com/blog/including-hidden-files-and-folders-in-turborepo-generators

config.ts

```ts
import type { PlopTypes } from "@turbo/gen";

import { registerAddInternalPackageGenerator } from "./add-internal-package";
import { registerScaffoldInfrastructureDbGenerator } from "./scaffold-database";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setHelper("ifEquals", function (arg1, arg2, options) {
    return arg1 == arg2 ? options.fn(this) : options.inverse(this);
  });
  registerScaffoldInfrastructureDbGenerator(plop);
  registerAddInternalPackageGenerator(plop);
}

```

scaffold-database.ts

[glob-pattern] 
- secutity https://medium.com/@balazs.csaba.diy/whats-this-glob-npm-madness-suddenly-every-node-js-image-is-vulnerable-but-why-1ba1b0cbad97 
- https://dustinpfister.github.io/2017/11/28/nodejs-glob/

utils.ts

- programmatic update https://www.npmjs.com/package/@npmcli/package-json

```ts
import PackageJson from "@npmcli/package-json";

type PackageJsonOperations = {
  addDependencies?: Record<string, string>;
  removeDependencies?: string[];
  addDevDependencies?: Record<string, string>;
  addScripts?: Record<string, string>;
  removeScripts?: string[];
};

```

####

buissiness/repositories

```ts
import type { User } from "../shared/dtos.ts";

export interface UserRepository {
  getUsers(): Promise<User[]>;
  getUsersCount(): Promise<number>;
}

```

[infrastructure]

drizzle/schema

```ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("User", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
});


export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

```

client.ts

[]https://www.npmjs.com/package/@libsql/client

```ts
import { createClient as createLibsqlClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "../../drizzle/schema";

export const createClient = ({
  url,
  syncUrl,
  authToken,
}: {
  url: string;
  syncUrl?: string;
  authToken?: string;
}) => {
  const client = createLibsqlClient({
    url,
    syncUrl,
    authToken,
    syncInterval: syncUrl ? 60 : undefined,
  });

  return drizzle(client, { schema });
};
export type DrizzleClient = ReturnType<typeof createClient>;

```

index.ts

```ts
```

seed.ts

```ts
import { createClient, users } from "./index";

const seed = async () => {
  const url = process.env.DATABASE_URL;
  const syncUrl = process.env.DATABASE_SYNC_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  console.log("🌱 Seeding database...");

  const db = createClient({
    url,
    syncUrl,
    authToken,
  });

  // Example: Create a test user
  await db.insert(users).values({
    name: "Test User",
    email: "test@example.com",
  });

  console.log("✅ Database seeded successfully");
};

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
```

#### headers

[]https://www.npmjs.com/package/@tusbar/cache-control?activeTab=readme

webutils

```ts
import type { HeadersArgs } from "react-router";
import { format, parse, type CacheControlValue } from "@tusbar/cache-control";

/**
 * Merge multiple headers objects into one (uses set so headers are overridden)
 */
export function mergeHeaders(
  ...headers: Array<ResponseInit["headers"] | null | undefined>
) {
  const merged = new Headers();
  for (const header of headers) {
    if (!header) continue;
    for (const [key, value] of new Headers(header).entries()) {
      merged.set(key, value);
    }
  }
  return merged;
}

/**
 * Combine multiple header objects into one (uses append so headers are not overridden)
 */
export function combineHeaders(
  ...headers: Array<ResponseInit["headers"] | null | undefined>
) {
  const combined = new Headers();
  for (const header of headers) {
    if (!header) continue;
    for (const [key, value] of new Headers(header).entries()) {
      combined.append(key, value);
    }
  }
  return combined;
}

/**
 * A utility for handling route headers, merging common use-case headers.
 *
 * This function combines headers by:
 * 1. Forwarding headers from the route's loader or action.
 * 2. Inheriting headers from the parent.
 * 3. Falling back to parent headers (if any) when headers are missing.
 *
 * @example
 * ```ts
 * export const headers: Route.HeadersFunction = pipeHeaders
 * ```
 */
export function pipeHeaders({
  parentHeaders,
  loaderHeaders,
  actionHeaders,
  errorHeaders,
}: HeadersArgs) {
  const headers = new Headers();

  // get the one that's actually in use
  let currentHeaders: Headers;
  if (errorHeaders !== undefined) {
    currentHeaders = errorHeaders;
  } else if (loaderHeaders.entries().next().done) {
    currentHeaders = actionHeaders;
  } else {
    currentHeaders = loaderHeaders;
  }

  // take in useful headers route loader/action
  // pass this point currentHeaders can be ignored
  const forwardHeaders = ["Cache-Control", "Vary", "Server-Timing"];
  for (const headerName of forwardHeaders) {
    const header = currentHeaders.get(headerName);
    if (header) {
      headers.set(headerName, header);
    }
  }

  headers.set(
    "Cache-Control",
    getConservativeCacheControl(
      parentHeaders.get("Cache-Control"),
      headers.get("Cache-Control"),
    ),
  );

  // append useful parent headers
  const inheritHeaders = ["Vary", "Server-Timing"];
  for (const headerName of inheritHeaders) {
    const header = parentHeaders.get(headerName);
    if (header) {
      headers.append(headerName, header);
    }
  }

  // fallback to parent headers if loader don't have
  const fallbackHeaders = ["Cache-Control", "Vary"];
  for (const headerName of fallbackHeaders) {
    if (headers.has(headerName)) {
      continue;
    }
    const fallbackHeader = parentHeaders.get(headerName);
    if (fallbackHeader) {
      headers.set(headerName, fallbackHeader);
    }
  }

  return headers;
}

/**
 * Given multiple Cache-Control headers, merge them and get the most conservative one.
 */
export function getConservativeCacheControl(
  ...cacheControlHeaders: Array<string | null>
): string {
  return format(
    cacheControlHeaders
      .filter(Boolean)
      .map((header) => parse(header))
      .reduce<CacheControlValue>((acc, current) => {
        for (const key in current) {
          const directive = key as keyof Required<CacheControlValue>; // keyof CacheControl includes functions
          const currentValue = current[directive];

          switch (typeof currentValue) {
            case "boolean": {
              if (currentValue) {
                acc[directive] = true as any;
              }

              break;
            }
            case "number": {
              const accValue = acc[directive] as number | undefined;

              if (accValue === undefined) {
                acc[directive] = currentValue as any;
              } else {
                const result = Math.min(accValue, currentValue);
                acc[directive] = result as any;
              }

              break;
            }
          }
        }
        return acc;
      }, {}),
  );
}
```

reset.d.ts

[]https://www.npmjs.com/package/%40total-typescript/ts-reset

```ts
import "@total-typescript/ts-reset";
```

vitest.config.ts

```ts
/// <reference types="vitest/config" />
/// <reference types="vite/client" />

import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "happy-dom",
    // setupFiles: ["./test/setup-test-env.ts"],
    include: ["./**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "node_modules",
      "dist",
      ".idea",
      ".git",
      ".cache",
      "**/*integration.test.ts",
    ],
  },
});

```

apps/vitest.config.ts

```ts
/// <reference types="vitest/config" />
/// <reference types="vite/client" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["./app/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup/setup-test-env.ts"],
  },
});
```

####

[]https://hono.dev/docs/middleware/builtin/request-id

index.ts

1. app load ctx w repositories and consistent session
2. build process ctx configured with proto, nounce and repositories
  a. ignore images, but not crawlers
3.  rate limit + session storage is types..
4. 
5. 


```ts
import type { ServerBuild, Session, SessionStorage } from "react-router";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { createMiddleware } from "hono/factory";
import { poweredBy } from "hono/powered-by";
import { requestId } from "hono/request-id";
import { trimTrailingSlash } from "hono/trailing-slash";
import { createHonoServer } from "react-router-hono-server/node";

import type { UserRepository } from "@react-router-gospel-stack/business/repositories";
import { resolveRepositories } from "@react-router-gospel-stack/infrastructure/repositories";

import { db } from "~/db.server.ts";
import { sessionStorage } from "~/session.server.ts";
import { appLogger } from "./middleware/logger.ts";
import { ALLOW_INDEXING, IS_DEV, IS_PROD } from "./middleware/misc.ts";
import { rateLimitMiddleware } from "./middleware/rate-limit.ts";
import {
  getSession,
  getSessionStorage,
  session,
  type SessionVariables,
} from "./middleware/session.ts";

const SENTRY_ENABLED = IS_PROD && process.env.SENTRY_DSN;

if (SENTRY_ENABLED) {
  void import("./utils/monitoring.ts").then(({ init }) => init());
}

if (process.env.MOCKS === "true" && IS_DEV) {
  await import("../tests/mocks/index.ts");
}

declare module "react-router" {
  interface AppLoadContext {
    readonly cspNonce: string;
    serverBuild: ServerBuild;
    session: Session;
    sessionStorage: SessionStorage;
    repositories: {
      user: UserRepository;
    };
  }
}

type HonoEnv = {
  Variables: SessionVariables & {
    cspNonce: string;
  };
};

const app = new Hono<HonoEnv>();

export default createHonoServer({
  app,
  defaultLogger: false,
  getLoadContext: async (c, { build }) => {
    let sessionStorage = getSessionStorage(c);
    let session = getSession(c);
    return {
      cspNonce: c.get("cspNonce"),
      serverBuild: build,
      session,
      sessionStorage,
      repositories: resolveRepositories(db),
    };
  },
  async beforeAll(app) {
    app.use(
      session({
        autoCommit: true,
        createSessionStorage() {
          return {
            ...sessionStorage,
            // If a user doesn't come back to the app within 30 days, their session will be deleted.
            async commitSession(session) {
              return sessionStorage.commitSession(session, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
              });
            },
          };
        },
      }),
    );
  },
  configure: (server) => {
    server.use("*", rateLimitMiddleware);
    server.use("*", requestId());
    server.use("*", appLogger());
    server.use(trimTrailingSlash());
    server.use("*", async (c, next) => {
      const proto = c.req.header("X-Forwarded-Proto");
      const host = c.req.header("Host");
      if (proto === "http") {
        const secureUrl = `https://${host}${c.req.url}`;
        return c.redirect(secureUrl, 301);
      }
      await next();
    });

    // server.use(cspNonceMiddleware);
    // server.use("*", secureHeadersMiddleware);

    server.use("*", poweredBy({ serverName: "Gospel Stack" }));
    server.on("GET", ["/favicons/*", "/img/*"], (c) => {
      return c.text("Not found", 404);
    });
    server.use(compress());
    if (!ALLOW_INDEXING) {
      server.use(
        createMiddleware(async (c, next) => {
          c.set("X-Robots-Tag", "noindex, nofollow");
          await next();
        }),
      );
    }
  },
});
```

#### middleware

cspnonce.ts

```ts

```

get-ip.ts

[] https://hono.dev/docs/helpers/conninfo
[]https://httptoolkit.com/blog/what-is-x-forwarded-for/

```ts
import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";

export const getIp = (c: Context) => {
  return (
    c.req.header("fly-client-ip") ??
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for") ??
    c.req.header("x-real-ip") ??
    getConnInfo(c).remote.address ??
    "unknown"
  );
};

```

logger.ts

```ts

```

misc.ts

```ts
const MODE = process.env.NODE_ENV ?? "development";
const ALLOW_INDEXING = process.env.ALLOW_INDEXING !== "false";
const IS_DEV = MODE === "development";

const IS_PROD = MODE === "production";

export { IS_PROD, IS_DEV, ALLOW_INDEXING };

```

rate-limit.ts

```ts
import type { Context } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { createMiddleware } from "hono/factory";

import { getIp } from "./get-ip.ts";

const IS_PROD = process.env.NODE_ENV === "production";
const maxMultiple =
  !IS_PROD || process.env.PLAYWRIGHT_TEST_BASE_URL ? 10_000 : 1;

type RateLimit = Parameters<typeof rateLimiter>[0];

const rateLimitDefault: RateLimit = {
  windowMs: 60 * 1000,
  limit: 1000 * maxMultiple,
  keyGenerator: (c: Context) => getIp(c),
};

// in production, this is 10 requests per minute
const strongestRateLimit = rateLimiter({
  ...rateLimitDefault,
  limit: 10 * maxMultiple,
});

// in production, this is 100 requests per minute
const strongRateLimit = rateLimiter({
  ...rateLimitDefault,
  limit: 100 * maxMultiple,
});

const generalRateLimit = rateLimiter(rateLimitDefault);

// Middleware pour gérer les limitations
export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  const path = c.req.url;
  const method = c.req.method;

  const strongPaths = ["/auth", "/contact"];

  // Vérification des méthodes et des chemins
  const isStrongPath = strongPaths.some((p) => path.includes(p));

  // Limitation de débit selon la méthode et le chemin
  if (method !== "GET" && method !== "HEAD") {
    return isStrongPath
      ? strongestRateLimit(c, next)
      : strongRateLimit(c, next);
  }

  // Cas spécial pour /verify
  if (path.includes("/verify")) {
    return strongestRateLimit(c, next);
  }

  // Limitation générale
  return generalRateLimit(c, next);
});

```

security.ts

```ts

```

session.ts

```ts
import type { Session, SessionData, SessionStorage } from "react-router";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";

type Env = {
  Variables: SessionVariables;
};

export type SessionVariables<Data = any, FlashData = any> = {
  sessionStorageKey: SessionStorage<Data, FlashData>;
  sessionKey: Session<Data, FlashData>;
};

/** @public */
export const sessionStorageKey = "sessionStorageKey";
/** @public */
export const sessionKey = "sessionKey";

export function session<Data = SessionData, FlashData = Data>(options: {
  autoCommit?: boolean;
  createSessionStorage(c: Context): SessionStorage<Data, FlashData>;
}) {
  return createMiddleware<Env>(async (c, next) => {
    let sessionStorage = options.createSessionStorage(c);

    c.set("sessionStorageKey", sessionStorage);

    // If autoCommit is disabled, we just create the SessionStorage and make it
    // available with c.get(sessionStorageSymbol), then call next() and
    // return.
    if (!options.autoCommit) return await next();

    // If autoCommit is enabled, we get the Session from the request.
    let session: Session<Data, FlashData>;
    try {
      session = await sessionStorage.getSession(
        c.req.raw.headers.get("cookie"),
      );
    } catch {
      throw new Response("", {
        status: 403,
      });
    }

    // And make it available with c.get(sessionSymbol).
    c.set("sessionKey", session);

    // Then we call next() to let the rest of the middlewares run.
    await next();

    // Finally, we commit the session before the response is sent.
    c.header("set-cookie", await sessionStorage.commitSession(session), {
      append: true,
    });
  });
}

export function getSessionStorage<
  E extends {
    Variables: SessionVariables;
  } = Env,
  Data = SessionData,
  FlashData = Data,
>(c: Context<E>): SessionStorage<Data, FlashData> {
  let sessionStorage = c.get("sessionStorageKey");
  if (!sessionStorage) {
    throw new Error("A session middleware was not set.");
  }
  return sessionStorage as unknown as SessionStorage<Data, FlashData>;
}

export function getSession<
  E extends {
    Variables: SessionVariables;
  } = Env,
  Data = SessionData,
  FlashData = Data,
>(c: Context<E>): Session<Data, FlashData> {
  let session = c.get("sessionKey");
  if (!session) {
    throw new Error("A session middleware was not set.");
  }
  return session as Session<Data, FlashData>;
}

```

####

```ts
import "@testing-library/jest-dom/vitest";
import "dotenv/config";
```