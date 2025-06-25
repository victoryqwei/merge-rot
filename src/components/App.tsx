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
    <Center minH="100vh" bgGradient="linear(to-t,rgb(129, 205, 255), #3b82f6)" position="relative">
      {/* Score Board - positioned at top */}
      <Box position="absolute" top={10} left="50%" transform="translateX(-50%)" zIndex={10} w="100%">
        <ScoreBoard />
      </Box>

      {/* Character Progression - positioned at bottom */}
      <Box position="absolute" bottom={10} left="50%" transform="translateX(-50%)" zIndex={10}>
        <CharacterProgression />
      </Box>

      {/* Game Canvas Container - centered */}
      <Box position="relative">
        <GameCanvas />
        <GameOverOverlay onRestart={handleRestart} />

        {/* Controls */}
        <VStack position="absolute" left="100%" top="50px" spacing={4} ml={4}>
          {shakeAngle === 0 && game.hasStarted && (
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
    </Center>
  );
});

export default App;
