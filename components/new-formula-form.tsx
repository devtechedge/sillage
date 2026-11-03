"use client";

import { useActionState } from "react";
import { createFormulaAction } from "@/app/formula-actions";
import type { ActionState } from "@/lib/action-state";

const INITIAL: ActionState = {};

export function NewFormulaForm({ briefId, title }: { briefId: string; title: string }) {
  const [state, action, pending] = useActionState(createFormulaAction, INITIAL);

  return (
    <form action={action} className="new-formula">
      <input type="hidden" name="briefId" value={briefId} />
      <h3>Start a formula</h3>
      <label className="field">
        <span>Working name</span>
        <input name="name" defaultValue={`${title} study`} maxLength={80} required />
      </label>
      <label className="field">
        <span>Concentration</span>
        <select name="concentrationBp" defaultValue="2000">
          <option value="1200">12% EDT</option>
          <option value="2000">20% EDP</option>
          <option value="2500">25% Parfum</option>
        </select>
      </label>
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Opening" : "Open a blank sheet"}
      </button>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
    </form>
  );
}
