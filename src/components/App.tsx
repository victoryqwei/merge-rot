import { Box, Button, Center, VStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { BiJoystick } from "react-icons/bi";
import { useGame } from "../game/useGame";
import CharacterProgression from "./CharacterProgression";
import GameCanvas from "./GameCanvas";
import GameModeOverlay from "./GameModeOverlay";
import GameOverOverlay from "./GameOverOverlay";
import ScoreBoard from "./ScoreBoard";

const App: React.FC = observer(() => {
  const game = useGame();
  const [shakeAngle, setShakeAngle] = useState(0);
  const [showModes, setShowModes] = useState(false);
  const [shakeCooldown, setShakeCooldown] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    function updateShake() {
      setShakeAngle(game.getShakeAngle());
      animationFrame = requestAnimationFrame(updateShake);
    }
    updateShake();
    return () => cancelAnimationFrame(animationFrame);
  }, [game]);

  // Handle shake cooldown timer
  useEffect(() => {
    if (shakeCooldown > 0) {
      const timer = setTimeout(() => {
        setShakeCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shakeCooldown]);

  const handleRestart = () => {
    game.restart();
  };

  const handleShake = () => {
    if (shakeCooldown === 0) {
      game.shake();
      setShakeCooldown(15); // Start 15 second cooldown
    }
  };

  const isShakeDisabled = shakeCooldown > 0 || shakeAngle !== 0 || !game.hasStarted;

  return (
    <Center minH="100vh" bgGradient="linear(to-t,rgb(129, 205, 255), #3b82f6)" position="relative">
      {/* Score Board - positioned at top */}
      <Box position="absolute" top={5} left="50%" transform="translateX(-50%)" zIndex={10} w="100%">
        <ScoreBoard />
      </Box>

      {/* Character Progression - positioned at bottom */}
      <Box position="absolute" bottom={5} left="50%" transform="translateX(-50%)" zIndex={10}>
        <CharacterProgression />
      </Box>

      {showModes && <GameModeOverlay setShowModes={setShowModes} />}
      <GameOverOverlay onRestart={handleRestart} />

      {/* Game Canvas Container - centered */}
      <Box position="relative">
        <GameCanvas />

        {/* Controls */}
        <VStack position="absolute" left="100%" top="50%" transform="translateY(-50%)" spacing={4} ml={4}>
          {game.hasStarted && (
            <Button
              colorScheme={shakeCooldown > 0 ? "gray" : "green"}
              size="md"
              onClick={handleShake}
              disabled={isShakeDisabled}
              _hover={{ transform: shakeCooldown > 0 ? "none" : "scale(1.05)" }}
              transition="all 0.2s"
              border="2px solid white">
              {shakeCooldown > 0 ? `Shake! (${shakeCooldown}s)` : "Shake!"}
            </Button>
          )}

          {!game.hasStarted && (
            <Button
              colorScheme="green"
              size="md"
              onClick={() => setShowModes(true)}
              border="2px solid white"
              iconSpacing={1}
              paddingX={2}
              leftIcon={<BiJoystick size={24} />}>
              Modes
            </Button>
          )}
        </VStack>
      </Box>
    </Center>
  );
});

export default App;
