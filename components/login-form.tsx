"use client";

import { useActionState } from "react";
import { signIn } from "@/app/auth-actions";
import type { ActionState } from "@/lib/action-state";

const INITIAL: ActionState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, INITIAL);

  return (
    <form action={action} className="stack-form">
      <label className="field">
        <span>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          placeholder="maya@sillage.demo"
          required
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="SillageDemo!2026"
          required
        />
      </label>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="button button--wide" type="submit" disabled={pending}>
        {pending ? "Opening" : "Sign in"}
      </button>
    </form>
  );
}
