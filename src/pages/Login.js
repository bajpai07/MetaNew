import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    <div style={{
      background: "var(--black)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px"
    }}>
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: "28px",
        fontWeight: "600",
        color: "var(--white)",
        letterSpacing: "0.08em",
        marginBottom: "48px"
      }}>
        METASHOP
      </div>

      <div style={{
        background: "var(--surface)",
        border: "0.5px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "36px 28px",
        width: "100%",
        maxWidth: "400px"
      }}>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "32px",
          fontWeight: "400",
          color: "var(--white)",
          marginBottom: "8px"
        }}>Welcome back</h2>
        
        <p style={{
          color: "var(--text-secondary)",
          fontSize: "14px",
          marginBottom: "32px"
        }}>Enter your details to access your account.</p>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{
              color: "var(--text-secondary)",
              fontSize: "12px",
              letterSpacing: "0.1em",
              fontFamily: "var(--font-body)",
              marginBottom: "6px",
              display: "block"
            }}>EMAIL</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@domain.com"
              style={{
                background: "var(--surface-2)",
                border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--white)",
                fontFamily: "var(--font-body)",
                fontSize: "15px",
                padding: "14px 16px",
                width: "100%",
                outline: "none",
                transition: "border-color 0.2s, background 0.2s"
              }} 
              onFocus={(e) => { e.target.style.borderColor = "var(--rose)"; e.target.style.background = "var(--surface-3)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "var(--surface-2)"; }}
            />
          </div>
          
          <div>
            <label style={{
              color: "var(--text-secondary)",
              fontSize: "12px",
              letterSpacing: "0.1em",
              fontFamily: "var(--font-body)",
              marginBottom: "6px",
              display: "block"
            }}>PASSWORD</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              style={{
                background: "var(--surface-2)",
                border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--white)",
                fontFamily: "var(--font-body)",
                fontSize: "15px",
                padding: "14px 16px",
                width: "100%",
                outline: "none",
                transition: "border-color 0.2s, background 0.2s"
              }} 
              onFocus={(e) => { e.target.style.borderColor = "var(--rose)"; e.target.style.background = "var(--surface-3)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "var(--surface-2)"; }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{
              background: "var(--rose)",
              color: "var(--white)",
              border: "none",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              width: "100%",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: "500",
              letterSpacing: "0.15em",
              cursor: "pointer",
              transition: "background 0.2s, transform 0.1s",
              marginTop: "12px"
            }}
            onMouseOver={(e) => e.target.style.background = "var(--rose-dark)"}
            onMouseOut={(e) => e.target.style.background = "var(--rose)"}
            onMouseDown={(e) => e.target.style.transform = "translateY(-1px)"}
            onMouseUp={(e) => e.target.style.transform = "translateY(0)"}
          >
            {isSubmitting ? "AUTHENTICATING..." : "LOGIN"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "32px", fontSize: "13px", color: "var(--text-secondary)" }}>
          Don't have an account? <Link to="/signup" style={{ color: "var(--rose)", textDecoration: "none", marginLeft: "4px" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
