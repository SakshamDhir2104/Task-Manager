import { ProjectRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireProjectAdmin, requireProjectMember } from "../middleware/projectAccess.js";
import { param } from "../utils/params.js";

const router = Router();

router.use(requireAuth);

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
});

router.get("/", async (req, res) => {
  const userId = req.user!.id;
  const projects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { tasks: true, members: true } },
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });
  const shaped = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    ownerId: p.ownerId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    taskCount: p._count.tasks,
    memberCount: p._count.members,
    myRole: p.ownerId === userId ? ProjectRole.ADMIN : p.members[0]?.role ?? ProjectRole.MEMBER,
  }));
  return res.json({ projects: shaped });
});

router.post("/", async (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }
  const { name, description } = parsed.data;
  const userId = req.user!.id;
  const project = await prisma.project.create({
    data: {
      name,
      description: description ?? undefined,
      ownerId: userId,
      members: {
        create: { userId, role: ProjectRole.ADMIN },
      },
    },
    include: {
      _count: { select: { tasks: true, members: true } },
    },
  });
  return res.status(201).json({
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      taskCount: project._count.tasks,
      memberCount: project._count.members,
      myRole: ProjectRole.ADMIN,
    },
  });
});

router.get("/:projectId", requireProjectMember, async (req, res) => {
  const projectId = param(req, "projectId");
  const userId = req.user!.id;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { tasks: true } },
    },
  });
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  const myRole =
    project.ownerId === userId
      ? ProjectRole.ADMIN
      : project.members.find((m) => m.userId === userId)?.role ?? ProjectRole.MEMBER;
  return res.json({
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      taskCount: project._count.tasks,
      myRole,
      members: project.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        user: m.user,
      })),
    },
  });
});

const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
});

router.patch("/:projectId", requireProjectMember, requireProjectAdmin, async (req, res) => {
  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }
  const projectId = param(req, "projectId");
  const data: { name?: string; description?: string | null } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  const project = await prisma.project.update({
    where: { id: projectId },
    data,
  });
  return res.json({ project });
});

router.delete("/:projectId", requireProjectMember, requireProjectAdmin, async (req, res) => {
  await prisma.project.delete({ where: { id: param(req, "projectId") } });
  return res.status(204).send();
});

const addMemberSchema = z.object({
  email: z.string().trim().email(),
  role: z.nativeEnum(ProjectRole).default(ProjectRole.MEMBER),
});

router.post("/:projectId/members", requireProjectMember, requireProjectAdmin, async (req, res) => {
  const parsed = addMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }
  const projectId = param(req, "projectId");
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) {
    return res.status(404).json({ error: "No user with that email" });
  }
  if (user.id === project.ownerId) {
    return res.status(400).json({ error: "Owner is already an admin member" });
  }
  try {
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role: parsed.data.role,
      },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    return res.status(201).json({ member });
  } catch {
    return res.status(409).json({ error: "User is already a member" });
  }
});

const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(ProjectRole),
});

router.patch(
  "/:projectId/members/:memberId",
  requireProjectMember,
  requireProjectAdmin,
  async (req, res) => {
    const parsed = updateMemberRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }
    const projectId = param(req, "projectId");
    const memberId = param(req, "memberId");
    const member = await prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
      include: { user: true },
    });
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (member.userId === project?.ownerId && parsed.data.role !== ProjectRole.ADMIN) {
      return res.status(400).json({ error: "Project owner must remain an admin" });
    }
    const updated = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role: parsed.data.role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    return res.json({ member: updated });
  },
);

router.delete(
  "/:projectId/members/:memberId",
  requireProjectMember,
  requireProjectAdmin,
  async (req, res) => {
    const projectId = param(req, "projectId");
    const memberId = param(req, "memberId");
    const member = await prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
    });
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (member.userId === project?.ownerId) {
      return res.status(400).json({ error: "Cannot remove the project owner from the team" });
    }
    await prisma.projectMember.delete({ where: { id: memberId } });
    return res.status(204).send();
  },
);

export default router;
