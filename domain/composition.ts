import {
  NOTES,
  TOTAL_PPT,
  type Composition,
  type Note,
  type NoteShares,
  type ResolvedLine,
} from "./types";

function emptyNoteShares(): NoteShares {
  return { TOP: 0, HEART: 0, BASE: 0 };
}

function toPercent(parts: number): number {
  return Math.round((parts / TOTAL_PPT) * 1000) / 10;
}

/**
 * Composition is expressed in parts per thousand. Shares are always taken
 * against the full 1000 parts, so an unfinished draft visibly leaves a gap
 * instead of flattering itself by normalising to its current total.
 */
export function compose(lines: ResolvedLine[]): Composition {
  const notePpt = emptyNoteShares();
  const familyPpt: Record<string, number> = {};
  let totalPpt = 0;

  for (const line of lines) {
    if (!Number.isInteger(line.ppt) || line.ppt <= 0) continue;
    totalPpt += line.ppt;
    if ((NOTES as readonly string[]).includes(line.material.note)) {
      notePpt[line.material.note as Note] += line.ppt;
    }
    familyPpt[line.material.family] = (familyPpt[line.material.family] ?? 0) + line.ppt;
  }

  const noteShare: NoteShares = {
    TOP: toPercent(notePpt.TOP),
    HEART: toPercent(notePpt.HEART),
    BASE: toPercent(notePpt.BASE),
  };

  const familyShare: Record<string, number> = {};
  for (const [family, ppt] of Object.entries(familyPpt)) {
    familyShare[family] = toPercent(ppt);
  }

  let dominantFamily: string | null = null;
  for (const [family, ppt] of Object.entries(familyPpt)) {
    if (
      dominantFamily === null ||
      ppt > familyPpt[dominantFamily] ||
      (ppt === familyPpt[dominantFamily] && family.localeCompare(dominantFamily) < 0)
    ) {
      dominantFamily = family;
    }
  }

  return { totalPpt, notePpt, noteShare, familyPpt, familyShare, dominantFamily };
}

export function partPercent(ppt: number): number {
  return Math.round((ppt / TOTAL_PPT) * 1000) / 10;
}
