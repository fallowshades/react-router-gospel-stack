#

##

###

1. mening of preflight

#### lax session with x-forword to load balancer



session.server.ts

```ts
import { createCookieSessionStorage } from "react-router";

import { env } from "~/env.server.ts";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__app_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  },
});
```

utils.ts

```ts
export function nameInitials(name: string) {
  const initials = name.split(" ").map((word) => word[0]);
  return initials.length === 1
    ? initials[0]
    : `${initials[0]}${initials[initials.length - 1]}`;
}
```

healthcheck.ts

[ip-n-protocol] https://docs.aws.amazon.com/elasticloadbalancing/latest/application/x-forwarded-headers.html

```ts
import type { Route } from "./+types/healthcheck";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const host =
    request.headers.get("X-Forwarded-Host") ?? request.headers.get("host");

  try {
    const url = new URL("/", `http://${host}`);
    // if we can connect to the database and make a simple query
    // and make a HEAD request to ourselves, then we're good.
    const [count] = await Promise.all([
      context.repositories.user.getUsersCount(),
      fetch(url.toString(), { method: "HEAD" }).then((r) => {
        if (!r.ok) return Promise.reject(new Error(r.statusText));
      }),
    ]);
    return new Response(`OK: ${count}`);
  } catch (error: unknown) {
    console.log("healthcheck ❌", { error });
    return new Response("ERROR", { status: 500 });
  }
};
```

#### async f(), given user

e2e/app.spec.ts

```ts
import { expect, test } from "@playwright/test";

test.describe("App", () => {
  test("Should navigate to /.", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
  });
});
```

e2e/memoize-unique.ts

```ts
import { faker } from "@faker-js/faker";

import { memoizeUnique } from "./memoize-unique.ts";

const unique = memoizeUnique(faker.internet.username);

export function createUser() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  const username = unique({
    firstName: firstName.toLowerCase(),
    lastName: lastName.toLowerCase(),
  })
    .slice(0, 20)
    .replace(/[^a-z0-9_]/g, "_");
  return {
    // username,
    name: `${firstName} ${lastName}`,
    email: `${username}@example.com`,
  };
}

export function createPassword(_username: string = faker.internet.username()) {
  return {
    hash: "secret",
  };
}

```

playwright-utils.ts

```ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import { test as base, type Page } from "@playwright/test";

import { createUser } from "./db-utils.ts";

export const dataCleanup = {
  users: new Set<string>(),
};

export function deleteUserByEmail(email: string) {
  // TODO implement
  throw new Error("Not implemented");
}

export async function insertNewUser({ password }: { password?: string } = {}) {
  throw new Error("Not implemented");
  // return user
}

export const test = base.extend<{
  login: (user?: { id: string }) => ReturnType<typeof loginPage>;
}>({
  login: [
    async ({ page, baseURL }, use) => {
      await use((user) => loginPage({ page, baseURL, user }));
    },
    { auto: true },
  ],
});

export const { expect } = test;

export async function loginPage({
  page,
  baseURL = `http://localhost:${process.env.PORT}/`,
  user: givenUser,
}: {
  page: Page;
  baseURL: string | undefined;
  user?: { id: string };
}) {
  throw new Error("Not implemented");
  // set cookies
  // await page.context().addCookies([
  //   {
  //     name: "_session",
  //     sameSite: "Lax",
  //     url: baseURL,
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === "production",
  //     value: _session,
  //   },
  // ]);
  // return user;
}

test.afterEach(async () => {
  // do something
  // type Delegate = {
  //   deleteMany: (opts: {
  //     where: { id: { in: Array<string> } };
  //   }) => Promise<unknown>;
  // };
  // async function deleteAll(items: Set<string>, delegate: Delegate) {
  //   if (items.size > 0) {
  //     await delegate.deleteMany({
  //       where: { id: { in: [...items] } },
  //     });
  //   }
  // }
  // await deleteAll(dataCleanup.users, prisma.user);
});

```

app.spec.ts

```ts
import "@testing-library/jest-dom/vitest";
import "dotenv/config";

```

#### setup filter challange

see database guide [](../database.md).

https://github.com/fallowshades/aws-base-stack/blob/main/docs/cloudflare-slug/iteration1-colocated-key-to-module.md

tools.ts

```ts
import type { Route } from "./+types/tools"
import { useState, useMemo } from "react"
// import { TagGroup, Tag } from "~/components/tag-group"
import { PageLayout, PageHeader } from "~/components/common/page-layout"
import { CyberCard } from "~/components/common/cyber-card"
import { Badge } from "~/components/common/badge"
// import { EmptyState } from "~/components/empty-state"
import { generateOGImageMeta } from "~/lib/meta-helpers"

const kinds = [
  "All",
  "Framework",
  "Language",
  "Library",
  "Platform",
  "AI",
  "Other",
]

interface Tool {
  name: string
  image: string
  website: string
  kind: (typeof kinds)[number]
}

const tools: Tool[] = [
```