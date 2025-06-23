import { Box, Button, VStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { FaFilm } from "react-icons/fa6";
import { useGame } from "../game/useGame";
import GameCanvas from "./GameCanvas";
import GameOverOverlay from "./GameOverOverlay";
import ScoreBoard from "./ScoreBoard";

const App: React.FC = observer(() => {
  const game = useGame();
  const [shakeAngle, setShakeAngle] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    function updateShake() {
      setShakeAngle(game.getShakeAngle());
      animationFrame = requestAnimationFrame(updateShake);
    }
    updateShake();
    return () => cancelAnimationFrame(animationFrame);
  }, [game]);

  const handleRestart = () => {
    game.restart();
  };

  const handleShake = () => {
    game.shake();
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-t,rgb(129, 205, 255), #3b82f6)" display="flex" justifyContent="center" p={4}>
      <VStack spacing={6} align="center">
        {/* Score Board */}
        <ScoreBoard />

        {/* Game Canvas Container */}
        <Box position="relative">
          <GameCanvas />
          <GameOverOverlay onRestart={handleRestart} />
        </Box>

        {/* Controls */}
        {shakeAngle === 0 && (
          <Button
            colorScheme="orange"
            size="lg"
            onClick={handleShake}
            _hover={{ transform: "scale(1.05)" }}
            transition="all 0.2s"
            leftIcon={<FaFilm />}>
            Shake!
          </Button>
        )}
      </VStack>
    </Box>
  );
});

export default App;
