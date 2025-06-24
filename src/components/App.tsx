import { Box, Button, Center, VStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { FaFilm } from "react-icons/fa6";
import { useGame } from "../game/useGame";
import GameCanvas from "./GameCanvas";
import GameOverOverlay from "./GameOverOverlay";
import ScoreBoard from "./ScoreBoard";
import CharacterProgression from "./CharacterProgression";

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
    <Center minH="100vh" bgGradient="linear(to-t,rgb(129, 205, 255), #3b82f6)" display="flex" justifyContent="center">
      <VStack spacing={2} align="center">
        {/* Score Board */}
        <ScoreBoard />

        {/* Game Canvas Container */}
        <Box position="relative">
          <GameCanvas />
          <GameOverOverlay onRestart={handleRestart} />

          {/* Controls */}
          <VStack position="absolute" left="100%" top="50px" spacing={4} ml={4}>
            {shakeAngle === 0 && (
              <Button
                colorScheme="green"
                size="md"
                onClick={handleShake}
                _hover={{ transform: "scale(1.05)" }}
                transition="all 0.2s"
                leftIcon={<FaFilm />}
                rightIcon={undefined}
                border="2px solid white">
                Shake!
              </Button>
            )}
          </VStack>
        </Box>

        {/* Character Progression */}
        <CharacterProgression />
      </VStack>
    </Center>
  );
});

export default App;
