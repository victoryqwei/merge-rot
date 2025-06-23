import React, { useEffect, useRef } from "react";
import { Box, Center } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useGameStore } from "../stores/StoreContext";
import { GameService } from "../services/GameService";

interface GameCanvasProps {
  gameService: GameService;
}

const GameCanvas: React.FC<GameCanvasProps> = observer(({ gameService }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStore = useGameStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize the game
    gameService.initializeGame(canvas);
  }, [gameService]);

  return (
    <Box position="relative" borderRadius="lg" overflow="hidden" boxShadow="xl">
      <canvas
        ref={canvasRef}
        width={400}
        height={600}
        style={{
          display: "block",
          cursor: "crosshair",
          background: "#f0f0f0",
        }}
      />

      {/* Loading Overlay */}
      {gameStore.isLoading && (
        <Center position="absolute" top={0} left={0} right={0} bottom={0} bg="blackAlpha.700" color="white" fontSize="xl" fontWeight="bold">
          Loading...
        </Center>
      )}
    </Box>
  );
});

export default GameCanvas;
