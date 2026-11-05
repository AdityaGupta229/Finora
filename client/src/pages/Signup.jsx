import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Wallet, User, Mail, Lock, ArrowRight } from "lucide-react";

const API_URL = "https://finora-backend-0qa8.onrender.com/api/auth";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API_URL}/signup`, form);
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      window.dispatchEvent(new Event("auth-change"));

      setSuccess("Account created successfully!");
      navigate("/",{replace:true});
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    paddingLeft: "42px",
    background: "#111a25",
    border: "1px solid #263445",
    borderRadius: "10px",
    color: "#f1f5f9",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080d14",
      color: "#f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <section style={{ width: "100%", maxWidth: "420px" }}>
        <Link to="/" style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
          color: "#f1f5f9",
          textDecoration: "none",
          fontSize: "25px",
          fontWeight: "800",
          marginBottom: "30px",
        }}>
          <span style={{
            background: "#a3e635",
            color: "#101710",
            width: "42px",
            height: "42px",
            borderRadius: "13px",
            display: "grid",
            placeItems: "center",
          }}>
            <Wallet size={23} />
          </span>
          Finora
        </Link>

        <div style={{
          background: "#0e151f",
          border: "1px solid #202d3b",
          borderRadius: "22px",
          padding: "30px",
          boxShadow: "0 24px 70px #00000040",
        }}>
          <p style={{
            color: "#a3e635",
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "2px",
          }}>
            START YOUR JOURNEY
          </p>

          <h1 style={{ fontSize: "29px", margin: "10px 0" }}>
            Create your account
          </h1>

          <p style={{
            color: "#91a0b3",
            fontSize: "14px",
            lineHeight: 1.6,
            marginBottom: "27px",
          }}>
            Build better money habits and take control of your financial future.
          </p>

          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Full name</label>
            <div style={fieldStyle}>
              <User size={17} color="#91a0b3" />
              <input
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={100}
                autoComplete="name"
                style={inputStyle}
              />
            </div>

            <label style={labelStyle}>Email address</label>
            <div style={fieldStyle}>
              <Mail size={17} color="#91a0b3" />
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                style={inputStyle}
              />
            </div>

            <label style={labelStyle}>Password</label>
            <div style={fieldStyle}>
              <Lock size={17} color="#91a0b3" />
              <input
                name="password"
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
                style={inputStyle}
              />
            </div>

            {error && (
              <p role="alert" style={messageStyle("#fb7185")}>{error}</p>
            )}

            {success && (
              <p role="status" style={messageStyle("#a3e635")}>{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "14px",
                padding: "14px",
                border: "none",
                borderRadius: "10px",
                background: loading ? "#789b32" : "#a3e635",
                color: "#101710",
                fontWeight: "800",
                fontSize: "15px",
                cursor: loading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "9px",
              }}
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p style={{
            textAlign: "center",
            color: "#91a0b3",
            fontSize: "14px",
            marginTop: "24px",
          }}>
            Already have an account?{" "}
            <Link to="/login" style={{
              color: "#a3e635",
              fontWeight: "700",
              textDecoration: "none",
            }}>
              Sign in
            </Link>
          </p>
        </div>

        <p style={{
          textAlign: "center",
          color: "#64748b",
          fontSize: "12px",
          marginTop: "20px",
        }}>
          Your financial journey starts here.
        </p>
      </section>
    </main>
  );
}

const labelStyle = {
  display: "block",
  color: "#cbd5e1",
  fontSize: "13px",
  fontWeight: "600",
  marginBottom: "8px",
  marginTop: "17px",
};

const fieldStyle = {
  display: "flex",
  alignItems: "center",
  position: "relative",
};

const messageStyle = (color) => ({
  color,
  fontSize: "13px",
  lineHeight: 1.5,
  marginTop: "15px",
  overflowWrap: "anywhere",
});