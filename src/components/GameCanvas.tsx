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
      overflow="hidden"
      style={{
        transform: `rotate(${game.getShakeAngle()}rad) translateY(${-game.getShakeLiftY()}px)`,
        transformOrigin: "center",
        transition: "transform 0.1s ease-out",
      }}>
      <canvas
        ref={canvasRef}
        width={400}
        height={600}
        style={{
          display: "block",
        }}
      />
    </Box>
  );
});

export default GameCanvas;
