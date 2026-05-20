import { TaskStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireProjectMember } from "../middleware/projectAccess.js";
import { param } from "../utils/params.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use("/:projectId/tasks", requireProjectMember);

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  assigneeId: z.string().cuid().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});

router.get("/:projectId/tasks", async (req, res) => {
  const projectId = param(req, "projectId");
  const status = req.query.status as string | undefined;
  const where: { projectId: string; status?: TaskStatus } = { projectId };
  if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
    where.status = status as TaskStatus;
  }
  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  return res.json({ tasks });
});

router.post("/:projectId/tasks", async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }
  const projectId = param(req, "projectId");
  const userId = req.user!.id;
  const { title, description, status, assigneeId, dueDate } = parsed.data;
  if (assigneeId) {
    const isMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: assigneeId },
    });
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const assigneeIsOwner = project?.ownerId === assigneeId;
    if (!isMember && !assigneeIsOwner) {
      return res.status(400).json({ error: "Assignee must be a project member" });
    }
  }
  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      description: description ?? undefined,
      status: status ?? TaskStatus.TODO,
      assigneeId: assigneeId ?? undefined,
      dueDate: dueDate ?? undefined,
      createdById: userId,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  return res.status(201).json({ task });
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  assigneeId: z.string().cuid().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});

router.patch("/:projectId/tasks/:taskId", async (req, res) => {
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }
  const projectId = param(req, "projectId");
  const taskId = param(req, "taskId");
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  const { assigneeId } = parsed.data;
  if (assigneeId !== undefined && assigneeId !== null) {
    const isMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: assigneeId },
    });
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const assigneeIsOwner = project?.ownerId === assigneeId;
    if (!isMember && !assigneeIsOwner) {
      return res.status(400).json({ error: "Assignee must be a project member" });
    }
  }
  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.assigneeId !== undefined) data.assigneeId = parsed.data.assigneeId;
  if (parsed.data.dueDate !== undefined) data.dueDate = parsed.data.dueDate;
  const updated = await prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  return res.json({ task: updated });
});

router.delete("/:projectId/tasks/:taskId", async (req, res) => {
  const projectId = param(req, "projectId");
  const taskId = param(req, "taskId");
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  await prisma.task.delete({ where: { id: taskId } });
  return res.status(204).send();
});

export default router;
