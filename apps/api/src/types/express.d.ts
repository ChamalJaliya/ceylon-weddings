import type { User } from "@ceylonweddings/contracts";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
