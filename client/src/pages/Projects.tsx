import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";
import type { ProjectSummary } from "../types";

export function Projects() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const { projects: list } = await api<{ projects: ProjectSummary[] }>("/api/projects");
    setProjects(list);
  }

  useEffect(() => {
    load()
      .catch(() => setError("Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/projects", {
        method: "POST",
        json: { name, description: description || null },
      });
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create project");
    }
  }

  return (
    <>
      <h1 className="page-title">Projects</h1>
      <p className="page-sub">Create teams and organize work</p>

      {error && <div className="error-banner">{error}</div>}

      <section className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>New project</h2>
        <form className="inline-form" onSubmit={handleCreate}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Description
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Create
          </button>
        </form>
      </section>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="muted">No projects yet. Create your first one above.</p>
      ) : (
        <div className="project-list">
          {projects.map((p) => (
            <article key={p.id} className="card project-card">
              <div>
                <h3>
                  <Link to={`/projects/${p.id}`}>{p.name}</Link>
                </h3>
                {p.description && <p className="muted">{p.description}</p>}
                <p className="muted">
                  {p.taskCount} tasks · {p.memberCount ?? "—"} members ·{" "}
                  <span className={`badge badge-${p.myRole.toLowerCase()}`}>{p.myRole}</span>
                </p>
              </div>
              <Link to={`/projects/${p.id}`} className="btn btn-ghost btn-sm">
                Open
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
