"use client";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <label className="field">
        <span>Email</span>
        <input className="input" name="email" type="email" autoComplete="username" required defaultValue={state.email} aria-invalid={!!state.error} aria-describedby={state.error ? "login-error" : undefined} />
      </label>
      <label className="field">
        <span>Password</span>
        <input className="input" name="password" type="password" autoComplete="current-password" required aria-invalid={!!state.error} aria-describedby={state.error ? "login-error" : undefined} />
      </label>
      <p id="login-error" role="alert" className="error-text min-h-5">{state.error}</p>
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
