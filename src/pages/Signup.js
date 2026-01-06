import React, { useState } from "react";
import API from "../api/api";
import useStore from "../store/useStore";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const loginStore = useStore((state) => state.login);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/signup", {
        name,
        email,
        password,
      });

      alert("Signup Successful! Logging you in...");

      const loginRes = await API.post("/auth/login", { email, password });
      loginStore(loginRes.data.user, loginRes.data.token);

      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create an Account</h2>
        <p className="auth-sub">Join MetaShop today</p>

        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="auth-input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="auth-btn">Signup</button>
        </form>
      </div>
    </div>
  );
}
