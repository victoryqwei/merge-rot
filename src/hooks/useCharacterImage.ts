import { useMemo } from "react";

// Preload all character images using Vite's import.meta.glob
const characterImages = import.meta.glob("../assets/characters/*/*.png", { eager: true, import: "default" }) as Record<string, string>;

export const useCharacterImage = (characterName: string | null): string | null => {
  return useMemo(() => {
    if (!characterName) return null;
    // Find the image by matching the filename
    const match = Object.entries(characterImages).find(([path]) => path.endsWith(`/${characterName}.png`));
    return match ? match[1] : null;
  }, [characterName]);
};
