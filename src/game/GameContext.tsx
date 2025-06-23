import React, { createContext } from "react";
import { SuikaGame } from "./SuikaGame";

export const GameContext = createContext<SuikaGame | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [game] = React.useState(() => new SuikaGame(null));
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
};
