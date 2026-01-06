import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../store/useStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const login = useStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email);
    navigate("/");
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Login</h2>

        <input
          className="auth-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button className="auth-btn">Login</button>
      </form>
    </div>
  );
}
