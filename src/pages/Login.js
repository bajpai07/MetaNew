import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

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
    if (success) {
      navigate("/");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "20px" }}>
      <div style={{ background: "#fff", padding: "40px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px" }}>
        <h2 style={{ marginBottom: "20px", color: "#282c3f", textAlign: "center" }}>Login to MetaShop</h2>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#535766" }}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #d4d5d9", borderRadius: "4px" }} />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#535766" }}>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #d4d5d9", borderRadius: "4px" }} />
          </div>

          <button type="submit" disabled={isSubmitting} style={{ padding: "14px", background: isSubmitting ? "#ccc" : "#FF3F6C", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "bold", cursor: isSubmitting ? "not-allowed" : "pointer", marginTop: "10px" }}>
            {isSubmitting ? "LOGGING IN..." : "LOGIN"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#535766" }}>
          Don't have an account? <Link to="/signup" style={{ color: "#FF3F6C", fontWeight: "bold", textDecoration: "none" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
