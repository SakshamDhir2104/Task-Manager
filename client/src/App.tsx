import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout, Layout } from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { ProjectDetailPage } from "./pages/ProjectDetail";
import { Projects } from "./pages/Projects";
import { Signup } from "./pages/Signup";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-page">
        <p className="muted">Loading…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <Signup />
            </PublicOnly>
          }
        />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
