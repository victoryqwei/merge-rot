import React, { useEffect, useRef, useState } from "react";
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
  const [shakeAngle, setShakeAngle] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    gameService.initializeGame(canvas);

    let animationFrame: number;
    function updateShake() {
      const game = gameService.getGame();
      if (game) {
        setShakeAngle((game.getShakeAngle() * 180) / Math.PI); // radians to degrees
      }
      animationFrame = requestAnimationFrame(updateShake);
    }
    updateShake();
    return () => cancelAnimationFrame(animationFrame);
  }, [gameService]);

  return (
    <Box
      position="relative"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="xl"
      style={{
        transform: `rotate(${shakeAngle}deg)`,
        transition: shakeAngle === 0 ? "transform 0.2s" : undefined,
      }}>
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
