
"use client";

import { useRouter } from "next/navigation";
import React, { FormEvent } from "react";
import { withBasePath } from "./_lib/constants";

export default function Page() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleNavigation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Username and password are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(withBasePath("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("fr-admin-authenticated", "true");
        sessionStorage.setItem("fr-admin-username", data.username || username);
        router.replace("/dashboard");
        return;
      }

      setError(data.error || "Invalid username or password");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-header">
          <p className="login-kicker">Admin Access</p>
          <h1 id="login-title">FR Admin Portal</h1>
        </div>

        {error && <div className="errorBox">{error}</div>}

        <form className="login-form" onSubmit={handleNavigation}>
          <label className="field">
            <span>UserName</span>
            <input
              type="text"
              name="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              autoComplete="username"
              placeholder="Enter UserName"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              autoComplete="current-password"
              placeholder="Enter password"
            />
          </label>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
