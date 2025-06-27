import { Box, Button, Center, VStack, Text } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useGame } from "../game/useGame";
import CharacterProgression from "./CharacterProgression";
import GameCanvas from "./GameCanvas";
import GameOverOverlay from "./GameOverOverlay";
import ScoreBoard from "./ScoreBoard";
import { BiJoystick } from "react-icons/bi";
import GameModeOverlay from "./GameModeOverlay";
import { GameMode } from "../constants/GameConstants";

const App: React.FC = observer(() => {
  const game = useGame();
  const [shakeAngle, setShakeAngle] = useState(0);
  const [showModes, setShowModes] = useState(false);

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

  const getCurrentModeDisplayName = () => {
    switch (game.getGameMode()) {
      case GameMode.ITALIAN_BRAINROT:
        return "Italian Brainrot";
      case GameMode.CATS:
        return "Cats";
      default:
        return "Unknown";
    }
  };

  return (
    <Center minH="100vh" bgGradient="linear(to-t,rgb(129, 205, 255), #3b82f6)" position="relative">
      {/* Game Mode Indicator - positioned at top left */}
      <Box position="absolute" top={5} left={5} zIndex={10}>
        <Text
          color="white"
          fontSize="sm"
          fontWeight="bold"
          bg="blackAlpha.300"
          px={3}
          py={1}
          borderRadius="full"
          border="1px solid whiteAlpha.300">
          {getCurrentModeDisplayName()}
        </Text>
      </Box>

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
        <VStack position="absolute" left="100%" top="50px" spacing={4} ml={4}>
          {shakeAngle === 0 && game.hasStarted && (
            <Button
              colorScheme="green"
              size="md"
              onClick={handleShake}
              _hover={{ transform: "scale(1.05)" }}
              transition="all 0.2s"
              // leftIcon={<FaFilm />}
              rightIcon={undefined}
              border="2px solid white">
              Shake!
            </Button>
          )}
        </VStack>

        <VStack position="absolute" left="100%" bottom="50px" spacing={4} ml={4}>
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
