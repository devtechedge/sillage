"use client";

import { useActionState } from "react";
import { changeRoleAction } from "@/app/formula-actions";
import { ROLES } from "@/domain/types";
import type { ActionState } from "@/lib/action-state";

const INITIAL: ActionState = {};

export function RoleForm({
  membershipId,
  current,
  disabled,
}: {
  membershipId: string;
  current: string;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState(changeRoleAction, INITIAL);

  return (
    <form action={action} className="role-form">
      <input type="hidden" name="membershipId" value={membershipId} />
      <select name="role" defaultValue={current} disabled={disabled || pending} aria-label="Role">
        {ROLES.map((role) => (
          <option value={role} key={role}>
            {role.toLowerCase()}
          </option>
        ))}
      </select>
      <button className="button button--small button--ghost" type="submit" disabled={disabled || pending}>
        {pending ? "Saving" : "Set"}
      </button>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.message}</p>}
    </form>
  );
}
