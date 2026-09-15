import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await signup(name, email, password);
    setIsSubmitting(false);
    if (success) navigate("/login");
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
          Create account
        </h1>
        <p className="meta" style={{ marginBottom: "44px" }}>
          So your looks and sizes are waiting next time.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          <div>
            <label className="meta" htmlFor="signup-name" style={{ display: "block" }}>
              Name
            </label>
            <input
              id="signup-name"
              className="field"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="meta" htmlFor="signup-email" style={{ display: "block" }}>
              Email
            </label>
            <input
              id="signup-email"
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
            <label className="meta" htmlFor="signup-password" style={{ display: "block" }}>
              Password
            </label>
            <input
              id="signup-password"
              className="field"
              type="password"
              required
              minLength="6"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least six characters"
            />
          </div>

          <button type="submit" className="btn btn-bone" disabled={isSubmitting} style={{ width: "100%", marginTop: "10px" }}>
            {isSubmitting ? "Creating account" : "Create account"}
          </button>
        </form>

        <p className="meta" style={{ marginTop: "36px" }}>
          Already registered?{" "}
          <Link to="/login" style={{ color: "var(--bone)", borderBottom: "1px solid var(--veil-strong)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
