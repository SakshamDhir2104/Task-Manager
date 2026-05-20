import type { AuthedRequestUser } from "./types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthedRequestUser;
      projectAccess?: import("./types.js").ProjectAccess;
    }
  }
}

export {};
