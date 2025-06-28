import { Box, Center, Text, VStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { MdOutlineTouchApp } from "react-icons/md";
import { useGame } from "../game/useGame";
import CharacterProgression from "./CharacterProgression";
import GameCanvas from "./GameCanvas";
import GameModeOverlay from "./GameModeOverlay";
import GameOverOverlay from "./GameOverOverlay";
import ScoreBoard from "./ScoreBoard";
import GameSettingsOverlay from "./GameSettingsOverlay";

const App: React.FC = observer(() => {
  const game = useGame();
  const [showModes, setShowModes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleRestart = () => {
    game.restart();
  };

  const isVertical = window.innerWidth < window.innerHeight;
  const oscillationLength = 40;

  return (
    <Center minH="100vh" bgGradient="linear(to-t,rgb(129, 205, 255), #3b82f6)" position="relative">
      {/* Score Board - positioned at top */}
      <Box position="absolute" top={5} left="50%" transform="translateX(-50%)" zIndex={10} w="100%">
        <ScoreBoard setShowSettings={setShowSettings} />
      </Box>

      {/* Character Progression - positioned at bottom */}
      <Box position="absolute" bottom={isVertical ? 10 : 5} left="50%" transform="translateX(-50%)" zIndex={10}>
        <CharacterProgression setShowModes={setShowModes} setShowSettings={setShowSettings} />
      </Box>

      {showModes && <GameModeOverlay setShowModes={setShowModes} />}
      {showSettings && <GameSettingsOverlay setShowSettings={setShowSettings} />}
      <GameOverOverlay onRestart={handleRestart} />

      {/* Game Canvas Container - centered */}
      <Box position="relative">
        <GameCanvas />

        {!game.hasStarted && (
          <VStack
            textAlign="center"
            h="58px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            pointerEvents={"none"}>
            <Text color="white" fontSize="4xl" fontWeight="bold" whiteSpace="nowrap">
              TOUCH TO PLAY
            </Text>
            <Text
              color="white"
              fontSize="2xl"
              fontWeight="bold"
              whiteSpace="nowrap"
              animation="oscillate 3s ease-in-out infinite"
              sx={{
                "@keyframes oscillate": {
                  "0%": { transform: `translateX(-${oscillationLength}px)` },
                  "50%": { transform: `translateX(${oscillationLength}px)` },
                  "100%": { transform: `translateX(-${oscillationLength}px)` },
                },
              }}>
              <MdOutlineTouchApp size={40} />
            </Text>
          </VStack>
        )}
      </Box>
    </Center>
  );
});

export default App;
