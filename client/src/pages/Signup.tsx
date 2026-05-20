import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api";
import { useAuth } from "../context/AuthContext";

export function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="page-title" style={{ fontSize: "1.35rem" }}>
        Create account
      </h2>
      {error && <div className="error-banner">{error}</div>}
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password (min 8 characters)
          <input
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1rem" }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </>
  );
}
