export type ProjectRole = "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  memberCount?: number;
  myRole: ProjectRole;
};

export type ProjectMember = {
  id: string;
  userId: string;
  role: ProjectRole;
  user: Pick<User, "id" | "email" | "name">;
};

export type ProjectDetail = ProjectSummary & {
  members: ProjectMember[];
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigneeId: string | null;
  dueDate: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignee: Pick<User, "id" | "name" | "email"> | null;
  createdBy: Pick<User, "id" | "name" | "email">;
  project?: { id: string; name: string };
};

export type DashboardData = {
  summary: {
    totalTasks: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
    myOpenTasks: number;
  };
  overdueTasks: Task[];
  myTasks: Task[];
};
