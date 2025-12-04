import { useState } from "react";
import { api } from "../api";
import { authUtils } from "../utils/auth.js";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/api/auth/signup", {
        fullName,
        email,
        password,
      });
      authUtils.setAuth(res.data.token, res.data.user);
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    }
  }

  return (
    <div style={wrap}>
      <form onSubmit={onSubmit} style={card}>
        <h2 style={{ marginTop: 0 }}>Create account</h2>
        <label>Full name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={input}
          placeholder="Your name"
        />
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
          placeholder="you@example.com"
        />
        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          style={input}
          placeholder="••••••••"
        />
        {error && <div style={errBox}>{error}</div>}
        <button style={btn} type="submit">
          Sign Up
        </button>
      </form>
    </div>
  );
}

const wrap = { display: "grid", placeItems: "center", minHeight: "60vh" };
const card = {
  background: "#0f172a",
  padding: 20,
  border: "1px solid #1f2937",
  borderRadius: 8,
  width: 360,
  display: "grid",
  gap: 10,
};
const input = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  color: "white",
  padding: 10,
  borderRadius: 6,
};
const btn = {
  background: "#2563eb",
  color: "white",
  border: 0,
  padding: "10px 12px",
  borderRadius: 6,
  cursor: "pointer",
  marginTop: 8,
};
const errBox = {
  color: "#fecaca",
  background: "#450a0a",
  border: "1px solid #7f1d1d",
  padding: 8,
  borderRadius: 6,
};
