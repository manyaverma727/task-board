import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { AuthResponse } from "../types";

interface AuthPanelProps {
  onAuthenticated: (response: AuthResponse) => void;
}

export function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "login") {
        return api.login({ email, password });
      }

      return api.signup({ name, email, password });
    },
    onSuccess: (data) => {
      onAuthenticated(data);
    },
  });

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Task Collaboration Platform</h1>
        <p className="muted">Interview MVP with real-time updates</p>

        <div className="auth-switch">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
          >
            Signup
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
          className="auth-form"
        >
          {mode === "signup" ? (
            <input
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          ) : null}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>

          {mutation.error instanceof Error ? (
            <p className="error">{mutation.error.message}</p>
          ) : null}
        </form>

        <p className="muted small">
          Demo (after seed): owner@demo.com / demo1234
        </p>
      </div>
    </div>
  );
}
