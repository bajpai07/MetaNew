import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

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
    if (success) {
      navigate("/login");
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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "400px" }}
      >
        <motion.div variants={itemVariants} style={{
          fontFamily: "var(--font-display)",
          fontSize: "28px",
          fontWeight: "600",
          color: "var(--white)",
          letterSpacing: "0.08em",
          marginBottom: "48px"
        }}>
          METASHOP
        </motion.div>

        <motion.div 
          variants={itemVariants}
          style={{
            background: "var(--surface)",
            border: "0.5px solid var(--border)",
            padding: "40px 32px",
            width: "100%"
          }}
        >
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "32px",
            fontWeight: "400",
            color: "var(--white)",
            marginBottom: "8px"
          }}>Create account</h2>
        
        <p style={{
          color: "var(--text-secondary)",
          fontSize: "14px",
          marginBottom: "32px"
        }}>Fill in your details to get started.</p>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <label style={{
              color: "var(--text-secondary)",
              fontSize: "12px",
              letterSpacing: "0.15em",
              fontFamily: "var(--font-body)",
              marginBottom: "8px",
              display: "block"
            }}>FULL NAME</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Your Name"
              style={{
                background: "var(--surface-2)",
                border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--white)",
                fontFamily: "var(--font-body)",
                fontSize: "15px",
                padding: "16px 18px",
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
              minLength="6"
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

          <motion.button 
            whileTap={{ scale: 0.97 }}
            type="submit" 
            disabled={isSubmitting}
            style={{
              background: "var(--rose)",
              color: "var(--white)",
              border: "none",
              borderRadius: "var(--radius-lg)",
              padding: "18px",
              width: "100%",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: "500",
              letterSpacing: "0.2em",
              cursor: "pointer",
              transition: "background 0.2s",
              marginTop: "16px"
            }}
            onMouseOver={(e) => e.target.style.background = "var(--rose-dark)"}
            onMouseOut={(e) => e.target.style.background = "var(--rose)"}
          >
            {isSubmitting ? "REGISTERING..." : "SIGN UP"}
          </motion.button>
        </form>

        <p style={{ textAlign: "center", marginTop: "32px", fontSize: "13px", color: "var(--text-secondary)" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--rose)", textDecoration: "none", marginLeft: "4px" }}>Login</Link>
        </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
