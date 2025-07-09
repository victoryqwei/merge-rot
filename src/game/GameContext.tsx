import React, { createContext } from "react";
import { SuikaGame } from "./SuikaGame";
let gameInstance: SuikaGame | null = null;

export const GameContext = createContext<SuikaGame | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [game] = React.useState(() => {
    if (!gameInstance) {
      gameInstance = new SuikaGame(null);
    }
    return gameInstance;
  });
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
};
