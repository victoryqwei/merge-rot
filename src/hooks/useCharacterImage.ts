import { useMemo } from "react";

export const useCharacterImage = (characterName: string | null): string | null => {
  return useMemo(() => {
    if (!characterName) return null;
    return `/src/assets/characters/${characterName}.png`;
  }, [characterName]);
};
