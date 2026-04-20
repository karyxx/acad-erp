"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      // Step 1: Get JWT token from the backend
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const tokenRes = await fetch("http://localhost:8000/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json();
        setError(err.detail || "Invalid email or password.");
        setLoading(false);
        return;
      }

      const { access_token } = await tokenRes.json();

      // Store the token in localStorage
      localStorage.setItem("acad_token", access_token);

      // Step 2: Fetch the user's role using getMe query
      const meRes = await fetch("http://localhost:8000/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          query: `query { getMe { id email roles } }`,
        }),
      });

      const meData = await meRes.json();
      const roles: string[] = meData?.data?.getMe?.roles ?? [];

      // Step 3: Redirect based on role
      if (roles.includes("Admin")) {
        router.push("/admin");
      } else if (roles.includes("Faculty")) {
        router.push("/faculty");
      } else if (roles.includes("Student")) {
        router.push("/student");
      } else {
        setError("Your account has no role assigned. Contact the administrator.");
      }
    } catch (e) {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--background)",
    }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "2.5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ color: "var(--primary)", marginBottom: "0.5rem", fontSize: "1.75rem" }}>Acad-ERP</h1>
          <p className="text-muted">Sign in to the institutional portal</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: "#fff1f0",
            border: "1px solid #ffccc7",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            color: "var(--danger)",
            fontSize: "0.875rem",
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, fontSize: "0.875rem" }}>
            Institutional Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="user@university.edu"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ marginBottom: 0 }}
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: 500, fontSize: "0.875rem" }}>Password</label>
            <a href="#" style={{ color: "var(--primary)", fontSize: "0.75rem", fontWeight: 500 }}>Forgot?</a>
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ marginBottom: 0 }}
          />
        </div>

        <button
          id="login-btn"
          className="btn-primary"
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", padding: "0.875rem", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Signing in…" : "Login"}
        </button>

        <div style={{ textAlign: "center", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--surface-container-high)" }}>
          <p className="text-muted" style={{ marginBottom: "0.75rem", fontSize: "0.75rem" }}>Development Previews</p>
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center" }}>
            <a href="/admin" style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 500 }}>Admin</a>
            <a href="/faculty" style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 500 }}>Faculty</a>
            <a href="/student" style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 500 }}>Student</a>
          </div>
        </div>
      </div>
    </div>
  );
}
