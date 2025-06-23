import { useMemo } from "react";
import { GameService } from "../services/GameService";
import { useGameStore } from "../stores/StoreContext";

export const useGameService = () => {
  const gameStore = useGameStore();

  const gameService = useMemo(() => new GameService(gameStore), [gameStore]);

  return gameService;
};
