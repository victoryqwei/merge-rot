import { Box } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React, { useEffect, useRef } from "react";
import { useGame } from "../game/useGame";

const GameCanvas: React.FC = observer(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useGame();

  useEffect(() => {
    if (canvasRef.current && !game.canvas) {
      game.setCanvas(canvasRef.current);
    }
  }, [game]);

  // Optionally, use game.getShakeAngle() for rotation

  return (
    <Box
      position="relative"
      padding="10px"
      borderRadius="lg"
      overflow="hidden"
      style={{
        transform: `rotate(${game.getShakeAngle()}rad)`,
        transformOrigin: "center",
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
    </Box>
  );
});

export default GameCanvas;
