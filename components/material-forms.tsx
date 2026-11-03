"use client";

import { useActionState } from "react";
import { addMaterialAction, intakeAction } from "@/app/formula-actions";
import { FAMILIES, NOTES } from "@/domain/types";
import type { ActionState } from "@/lib/action-state";

const INITIAL: ActionState = {};

export function MaterialForms({
  materials,
}: {
  materials: { id: string; name: string; code: string }[];
}) {
  const [addState, runAdd, addPending] = useActionState(addMaterialAction, INITIAL);
  const [intakeState, runIntake, intakePending] = useActionState(intakeAction, INITIAL);

  return (
    <div className="material-forms">
      <form action={runIntake} className="form-card">
        <h2>Record intake</h2>
        <label className="field">
          <span>Material</span>
          <select name="materialId" required>
            <option value="">Choose a drawer</option>
            {materials.map((material) => (
              <option value={material.id} key={material.id}>
                {material.name} / {material.code}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Grams received</span>
          <input name="grams" type="number" min="0.001" step="0.001" placeholder="25" required />
        </label>
        <button className="button" type="submit" disabled={intakePending}>
          {intakePending ? "Recording" : "Add to stock"}
        </button>
        {intakeState.error && <p className="form-error" role="alert">{intakeState.error}</p>}
        {intakeState.ok && <p className="form-ok">{intakeState.message}</p>}
      </form>

      <details className="form-card form-card--drawer">
        <summary>
          <span>Add a material</span>
          <span className="mono">new drawer</span>
        </summary>
        <form action={runAdd}>
          <div className="form-grid">
            <label className="field">
              <span>Code</span>
              <input name="code" maxLength={6} placeholder="ORRI" required />
            </label>
            <label className="field">
              <span>Name</span>
              <input name="name" maxLength={80} placeholder="Orris Butter" required />
            </label>
            <label className="field">
              <span>Family</span>
              <select name="family" required>
                {FAMILIES.map((family) => (
                  <option value={family} key={family}>{family}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Note</span>
              <select name="note" required>
                {NOTES.map((note) => (
                  <option value={note} key={note}>{note.toLowerCase()}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Cost, cents / g</span>
              <input name="costCentsPerGram" type="number" min="0" step="1" defaultValue="100" required />
            </label>
            <label className="field">
              <span>Persistence, hours</span>
              <input name="persistenceHours" type="number" min="1" max="72" defaultValue="8" required />
            </label>
            <label className="field">
              <span>Opening stock, g</span>
              <input name="stockGrams" type="number" min="0" step="0.001" defaultValue="10" required />
            </label>
            <label className="field">
              <span>House maximum, parts</span>
              <input name="maxPpt" type="number" min="1" max="1000" defaultValue="50" required />
            </label>
            <label className="field">
              <span>Reorder line, g</span>
              <input name="reorderGrams" type="number" min="0" step="0.001" defaultValue="2" required />
            </label>
            <label className="field field--wide">
              <span>Description</span>
              <input name="description" maxLength={240} placeholder="A cold root, butter and chalk." required />
            </label>
          </div>
          <button className="button button--ghost" type="submit" disabled={addPending}>
            {addPending ? "Adding" : "Add to cabinet"}
          </button>
          {addState.error && <p className="form-error" role="alert">{addState.error}</p>}
          {addState.ok && <p className="form-ok">{addState.message}</p>}
        </form>
      </details>
    </div>
  );
}
