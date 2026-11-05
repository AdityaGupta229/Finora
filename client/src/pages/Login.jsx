import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Wallet, Mail, Lock, ArrowRight } from "lucide-react";

const API_URL = "https://finora-backend-0qa8.onrender.com/api/auth";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const response = await axios.post(`${API_URL}/login`, form);
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      console.log("Login User",user);
     

      window.dispatchEvent(new Event("auth-change"));
      navigate("/",{replace:true});
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to login. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}><Wallet size={23} /></span>
          Finora
        </Link>

        <div style={styles.card}>
          <p style={styles.eyebrow}>WELCOME BACK</p>
          <h1 style={styles.heading}>Sign in to Finora</h1>
          <p style={styles.subtitle}>
            Your financial progress is waiting for you.
          </p>

          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Email address</label>
            <div style={styles.field}>
              <Mail size={18} color="#91a0b3" />
              <input
                style={styles.input}
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                autoComplete="email"
                required
              />
            </div>

            <label style={styles.label}>Password</label>
            <div style={styles.field}>
              <Lock size={18} color="#91a0b3" />
              <input
                style={styles.input}
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p role="alert" style={styles.error}>{error}</p>
            )}

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p style={styles.footer}>
            Don't have an account?{" "}
            <Link to="/signup" style={styles.link}>Create account</Link>
          </p>
        </div>

        <p style={styles.bottom}>Make every rupee count.</p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#080d14",
    color: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "Inter, system-ui, sans-serif",
    boxSizing: "border-box",
  },
  container: { width: "100%", maxWidth: "420px" },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: "#f1f5f9",
    textDecoration: "none",
    fontSize: "25px",
    fontWeight: "800",
    marginBottom: "30px",
  },
  logoIcon: {
    background: "#a3e635",
    color: "#101710",
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    display: "grid",
    placeItems: "center",
  },
  card: {
    background: "#0e151f",
    border: "1px solid #202d3b",
    borderRadius: "22px",
    padding: "30px",
    boxShadow: "0 24px 70px #00000040",
  },
  eyebrow: {
    color: "#a3e635",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "2px",
  },
  heading: { fontSize: "29px", margin: "10px 0" },
  subtitle: {
    color: "#91a0b3",
    fontSize: "14px",
    lineHeight: 1.6,
    marginBottom: "27px",
  },
  label: {
    display: "block",
    color: "#cbd5e1",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "8px",
    marginTop: "17px",
  },
  field: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 12px",
    background: "#111a25",
    border: "1px solid #263445",
    borderRadius: "10px",
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: "14px 0",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#f1f5f9",
    fontSize: "14px",
  },
  error: {
    color: "#fb7185",
    fontSize: "13px",
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },
  button: {
    width: "100%",
    marginTop: "22px",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background: "#a3e635",
    color: "#101710",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
  },
  footer: {
    textAlign: "center",
    color: "#91a0b3",
    fontSize: "14px",
    marginTop: "24px",
  },
  link: {
    color: "#a3e635",
    fontWeight: "700",
    textDecoration: "none",
  },
  bottom: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "12px",
    marginTop: "20px",
  },
};