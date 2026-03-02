import type { UserRepository } from "@Hamoria/business/repositories";

import type { DrizzleClient } from "../database/index.ts";
import { DrizzleUserRepository } from "./user-repository.ts";

export { DrizzleUserRepository } from "./user-repository.ts";

export const resolveRepositories = (
  db: DrizzleClient,
): { user: UserRepository } => ({
  user: DrizzleUserRepository(db),
});
