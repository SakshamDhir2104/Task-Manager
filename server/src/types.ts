import type { ProjectRole } from "@prisma/client";

export type JwtPayload = {
  sub: string;
  email: string;
};

export type AuthedRequestUser = {
  id: string;
  email: string;
};

export type ProjectAccess = {
  role: ProjectRole;
  projectId: string;
};
