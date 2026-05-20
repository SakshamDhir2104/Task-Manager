import { ProjectRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db.js";
import { param } from "../utils/params.js";

/** Loads membership for :projectId and attaches req.projectAccess. Returns 403/404 as appropriate. */
export async function requireProjectMember(req: Request, res: Response, next: NextFunction) {
  const projectId = param(req, "projectId");
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: { where: { userId } },
    },
  });
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  const membership = project.members[0];
  let role = membership?.role;
  if (!role && project.ownerId === userId) {
    role = ProjectRole.ADMIN;
  }
  if (!role) {
    return res.status(403).json({ error: "You are not a member of this project" });
  }
  req.projectAccess = { role, projectId };
  next();
}

export function requireProjectAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.projectAccess?.role !== ProjectRole.ADMIN) {
    return res.status(403).json({ error: "Admin role required" });
  }
  next();
}
