import { diffWords } from "diff";

export type ChangeResult = {
  additions: string;
  removals: string;
  changePercentage: number;
  severity: "minor" | "moderate" | "major";
};

export function detectChange(
  previousText: string,
  currentText: string,
): ChangeResult {
  const parts = diffWords(previousText, currentText);

  let additions = "";
  let removals = "";

  let addedCharacters = 0;
  let removedCharacters = 0;

  for (const part of parts) {
    if (part.added) {
      additions += part.value;
      addedCharacters += part.value.length;
    }

    if (part.removed) {
      removals += part.value;
      removedCharacters += part.value.length;
    }
  }

  const totalChanges = addedCharacters + removedCharacters;

  const baseLength = Math.max(previousText.length, currentText.length, 1);

  const changePercentage = Math.round((totalChanges / baseLength) * 100);

  let severity: ChangeResult["severity"];

  if (changePercentage < 5) {
    severity = "minor";
  } else if (changePercentage < 20) {
    severity = "moderate";
  } else {
    severity = "major";
  }

  return {
    additions,
    removals,
    changePercentage,
    severity,
  };
}
