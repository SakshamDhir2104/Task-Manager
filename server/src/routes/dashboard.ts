import { TaskStatus } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const userId = req.user!.id;
  const now = new Date();

  const projectIds = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  });
  const ids = projectIds.map((p) => p.id);
  if (ids.length === 0) {
    return res.json({
      summary: {
        totalTasks: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
        overdue: 0,
        myOpenTasks: 0,
      },
      overdueTasks: [],
      myTasks: [],
    });
  }

  const [statusGroups, overdueTasks, myOpenTasks] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      where: { projectId: { in: ids } },
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: {
        projectId: { in: ids },
        dueDate: { lt: now },
        status: { not: TaskStatus.DONE },
      },
      orderBy: { dueDate: "asc" },
      take: 50,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        projectId: { in: ids },
        assigneeId: userId,
        status: { not: TaskStatus.DONE },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 30,
      include: {
        project: { select: { id: true, name: true } },
      },
    }),
  ]);

  const counts: Record<TaskStatus, number> = {
    [TaskStatus.TODO]: 0,
    [TaskStatus.IN_PROGRESS]: 0,
    [TaskStatus.DONE]: 0,
  };
  for (const row of statusGroups) {
    counts[row.status] = row._count._all;
  }
  const totalTasks = Object.values(counts).reduce((a, b) => a + b, 0);

  return res.json({
    summary: {
      totalTasks,
      todo: counts[TaskStatus.TODO],
      inProgress: counts[TaskStatus.IN_PROGRESS],
      done: counts[TaskStatus.DONE],
      overdue: overdueTasks.length,
      myOpenTasks: myOpenTasks.length,
    },
    overdueTasks,
    myTasks: myOpenTasks,
  });
});

export default router;
