import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Not a card floating in the middle of a page — the form sits left on an
 * otherwise empty ink field, the proportions of a door rather than a dialog.
 *
 * The page carried its own large wordmark until it was set beside the one in
 * the navbar directly above it and read as a mistake. The navbar serves.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);
    if (success) navigate("/");
  };

  return (
    <div
      className="gutter"
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        paddingTop: "calc(var(--nav-h) + 72px)",
        paddingBottom: "calc(var(--tab-h) + 72px)"
      }}
    >

      <div style={{ width: "100%", maxWidth: "380px" }}>
        <h1 className="display display-l" style={{ marginBottom: "10px" }}>
          Sign in
        </h1>
        <p className="meta" style={{ marginBottom: "44px" }}>
          Your saved looks, sizes and orders are kept here.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          <div>
            <label className="meta" htmlFor="login-email" style={{ display: "block" }}>
              Email
            </label>
            <input
              id="login-email"
              className="field"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
            />
          </div>

          <div>
            <label className="meta" htmlFor="login-password" style={{ display: "block" }}>
              Password
            </label>
            <input
              id="login-password"
              className="field"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-bone" disabled={isSubmitting} style={{ width: "100%", marginTop: "10px" }}>
            {isSubmitting ? "Signing in" : "Sign in"}
          </button>
        </form>

        <p className="meta" style={{ marginTop: "36px" }}>
          No account yet?{" "}
          <Link to="/signup" style={{ color: "var(--bone)", borderBottom: "1px solid var(--veil-strong)" }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
