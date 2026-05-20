import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { DashboardData, Task, TaskStatus } from "../types";

function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status.replace("_", " ")}</span>;
}

function TaskRow({ task }: { task: Task }) {
  const overdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  return (
    <tr>
      <td>
        <Link to={`/projects/${task.project?.id ?? task.projectId}`}>{task.title}</Link>
        {task.project && (
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            {task.project.name}
          </div>
        )}
      </td>
      <td>
        <StatusBadge status={task.status} />
      </td>
      <td>{task.assignee?.name ?? "—"}</td>
      <td>
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
        {overdue && <span className="badge badge-overdue" style={{ marginLeft: 6 }}>Overdue</span>}
      </td>
    </tr>
  );
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<DashboardData>("/api/dashboard")
      .then(setData)
      .catch(() => setError("Failed to load dashboard"));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <p className="muted">Loading dashboard…</p>;

  const { summary, overdueTasks, myTasks } = data;

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Overview of tasks across your projects</p>

      <div className="card-grid">
        <div className="card stat">
          <div className="stat-value">{summary.totalTasks}</div>
          <div className="stat-label">Total tasks</div>
        </div>
        <div className="card stat">
          <div className="stat-value">{summary.todo}</div>
          <div className="stat-label">To do</div>
        </div>
        <div className="card stat">
          <div className="stat-value">{summary.inProgress}</div>
          <div className="stat-label">In progress</div>
        </div>
        <div className="card stat">
          <div className="stat-value">{summary.done}</div>
          <div className="stat-label">Done</div>
        </div>
        <div className="card stat">
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {summary.overdue}
          </div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="card stat">
          <div className="stat-value">{summary.myOpenTasks}</div>
          <div className="stat-label">Assigned to me</div>
        </div>
      </div>

      <section className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Overdue tasks</h2>
        {overdueTasks.length === 0 ? (
          <p className="muted">No overdue tasks — great work!</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {overdueTasks.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>My open tasks</h2>
        {myTasks.length === 0 ? (
          <p className="muted">Nothing assigned to you right now.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {myTasks.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
