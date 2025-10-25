import { Box } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React, { useEffect, useRef } from "react";
import { useGame } from "../game/useGame";
import PopBanner from "./PopBanner";

const GameCanvas: React.FC = observer(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useGame();

  useEffect(() => {
    if (canvasRef.current && !game.canvas) {
      game.setCanvas(canvasRef.current);
    }
  }, [game]);

  // Optionally, use game.getShakeAngle() for rotation

  const boxScale = game.getBoxScale();

  return (
    <Box
      position="relative"
      overflow="hidden"
      cursor="pointer"
      style={{
        transform: `rotate(${game.getShakeAngle()}rad) translateY(${-game.getShakeLiftY()}px) scale(${boxScale})`,
        transformOrigin: "center",
        transition: "transform 0.1s ease-out",
      }}>
      <PopBanner />
      <canvas
        ref={canvasRef}
        width={400}
        height={600}
        style={{
          display: "block",
          maxHeight: "70vh",
          width: "auto",
          height: "auto",
          objectFit: "contain",
        }}
      />
    </Box>
  );
});

export default GameCanvas;
