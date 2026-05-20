import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          Team<span>Task</span>
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/projects">Projects</NavLink>
        </nav>
        <div style={{ marginTop: "auto" }}>
          <p className="muted" style={{ margin: "0 0 0.5rem" }}>
            {user?.name}
          </p>
          <p className="muted" style={{ margin: "0 0 0.75rem", fontSize: "0.8rem" }}>
            {user?.email}
          </p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export function AuthLayout() {
  return (
    <div className="auth-page">
      <div className="auth-card card">
        <p style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <Link to="/" className="brand">
            Team<span>Task</span> Manager
          </Link>
        </p>
        <Outlet />
      </div>
    </div>
  );
}
