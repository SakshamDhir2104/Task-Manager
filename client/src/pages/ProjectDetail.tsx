import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import type { ProjectDetail, ProjectMember, ProjectRole, Task, TaskStatus } from "../types";

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus | "">("");
  const [error, setError] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<ProjectRole>("MEMBER");

  const isAdmin = project?.myRole === "ADMIN";

  const load = useCallback(async () => {
    if (!projectId) return;
    const [projRes, tasksRes] = await Promise.all([
      api<{ project: ProjectDetail }>(`/api/projects/${projectId}`),
      api<{ tasks: Task[] }>(
        `/api/projects/${projectId}/tasks${filter ? `?status=${filter}` : ""}`,
      ),
    ]);
    setProject(projRes.project);
    setTasks(tasksRes.tasks);
  }, [projectId, filter]);

  useEffect(() => {
    load().catch(() => setError("Failed to load project"));
  }, [load]);

  async function createTask(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        json: {
          title: taskTitle,
          description: taskDesc || null,
          assigneeId: taskAssignee || null,
          dueDate: taskDue || null,
        },
      });
      setTaskTitle("");
      setTaskDesc("");
      setTaskAssignee("");
      setTaskDue("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create task");
    }
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    await api(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      json: { status },
    });
    await load();
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    await api(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
    await load();
  }

  async function addMember(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api(`/api/projects/${projectId}/members`, {
        method: "POST",
        json: { email: memberEmail, role: memberRole },
      });
      setMemberEmail("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add member");
    }
  }

  async function updateMemberRole(member: ProjectMember, role: ProjectRole) {
    await api(`/api/projects/${projectId}/members/${member.id}`, {
      method: "PATCH",
      json: { role },
    });
    await load();
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this member?")) return;
    await api(`/api/projects/${projectId}/members/${memberId}`, { method: "DELETE" });
    await load();
  }

  if (!project) {
    return <p className="muted">{error || "Loading project…"}</p>;
  }

  const assignable = project.members.map((m) => m.user);

  return (
    <>
      <p className="muted" style={{ marginBottom: "0.5rem" }}>
        <Link to="/projects">← Projects</Link>
      </p>
      <h1 className="page-title">{project.name}</h1>
      <p className="page-sub">
        {project.description || "No description"} ·{" "}
        <span className={`badge badge-${project.myRole.toLowerCase()}`}>{project.myRole}</span>
      </p>

      {error && <div className="error-banner">{error}</div>}

      <section className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Team</h2>
        {isAdmin && (
          <form className="inline-form" onSubmit={addMember} style={{ marginBottom: "1rem" }}>
            <label>
              Member email
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                required
                placeholder="user@example.com"
              />
            </label>
            <label>
              Role
              <select value={memberRole} onChange={(e) => setMemberRole(e.target.value as ProjectRole)}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            <button type="submit" className="btn btn-primary">
              Add member
            </button>
          </form>
        )}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {project.members.map((m) => (
                <tr key={m.id}>
                  <td>{m.user.name}</td>
                  <td>{m.user.email}</td>
                  <td>
                    {isAdmin ? (
                      <select
                        value={m.role}
                        onChange={(e) => updateMemberRole(m, e.target.value as ProjectRole)}
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : (
                      <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => removeMember(m.id)}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Tasks</h2>

        <div className="tabs">
          <button
            type="button"
            className={`btn btn-sm ${filter === "" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter("")}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setFilter(s)}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        <form className="inline-form" onSubmit={createTask} style={{ marginBottom: "1.25rem" }}>
          <label>
            Title
            <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
          </label>
          <label>
            Description
            <input value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
          </label>
          <label>
            Assignee
            <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {assignable.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary">
            Add task
          </button>
        </form>

        {tasks.length === 0 ? (
          <p className="muted">No tasks in this view.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const overdue =
                    t.dueDate &&
                    new Date(t.dueDate) < new Date() &&
                    t.status !== "DONE";
                  return (
                    <tr key={t.id}>
                      <td>
                        <strong>{t.title}</strong>
                        {t.description && (
                          <div className="muted" style={{ fontSize: "0.85rem" }}>
                            {t.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <select
                          value={t.status}
                          onChange={(e) =>
                            updateTaskStatus(t.id, e.target.value as TaskStatus)
                          }
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{t.assignee?.name ?? "—"}</td>
                      <td>
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                        {overdue && (
                          <span className="badge badge-overdue" style={{ marginLeft: 6 }}>
                            Overdue
                          </span>
                        )}
                      </td>
                      <td className="row-actions">
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteTask(t.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
