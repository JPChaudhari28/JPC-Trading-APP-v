import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Dashboard from "./pages/EnhancedDashboard.jsx";
import Login from "./pages/Login.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Signup from "./pages/Signup.jsx";
import Wallet from "./pages/Wallet.jsx";
import Watchlist from "./pages/Watchlist.jsx";
import { authUtils } from "./utils/auth.js";

function useAuth() {
  return {
    token: authUtils.getToken(),
    user: authUtils.getUser(),
    isAuthed: authUtils.isAuthenticated(),
  };
}

function ProtectedRoute({ children }) {
  const { isAuthed } = useAuth();
  return isAuthed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, Arial",
        background: "#f8fafc",
        minHeight: "100vh",
        color: "#0f172a",
      }}
    >
      <header
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          padding: "12px 20px",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          background: "#ffffff",
          zIndex: 10,
        }}
      >
        <Link
          to="/"
          style={{ color: "#0f172a", fontWeight: 700, textDecoration: "none" }}
        >
          JPC Trading
        </Link>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link to="/" style={{ color: "#334155" }}>
            Dashboard
          </Link>
          <Link to="/portfolio" style={{ color: "#334155" }}>
            Portfolio
          </Link>
          <Link to="/watchlist" style={{ color: "#334155" }}>
            Watchlist
          </Link>
          <Link to="/wallet" style={{ color: "#334155" }}>
            Wallet
          </Link>
        </nav>
        <div style={{ marginLeft: "auto" }}>
          <AuthActions />
        </div>
      </header>
      <main style={{ padding: 20 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <Portfolio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function AuthActions() {
  const navigate = useNavigate();
  const { isAuthed, user } = useAuth();
  if (!isAuthed) {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => navigate("/login")} style={btn}>
          Login
        </button>
        <button onClick={() => navigate("/signup")} style={btnOutline}>
          Sign Up
        </button>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ color: "#cbd5e1", fontSize: "14px" }}>
        Welcome, {user?.fullName}
      </span>
      <button
        onClick={() => {
          authUtils.clearAuth();
          navigate("/login");
        }}
        style={btn}
      >
        Logout
      </button>
    </div>
  );
}

const btn = {
  background: "#2563eb",
  color: "white",
  border: 0,
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
};
const btnOutline = {
  background: "transparent",
  color: "#2563eb",
  border: "1px solid #93c5fd",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
};
