import { Box, Center, Text, VStack, useColorMode } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { MdOutlineTouchApp } from "react-icons/md";
import { useGame } from "../game/useGame";
import CrazyGames from "../game/CrazyGames";
import CharacterProgression from "./CharacterProgression";
import GameCanvas from "./GameCanvas";
import GameModeOverlay from "./GameModeOverlay";
import GameOverOverlay from "./GameOverOverlay";
import GameSettingsOverlay from "./GameSettingsOverlay";
import LeaderboardOverlay from "./LeaderboardOverlay";
import LoadingOverlay from "./LoadingOverlay";
import SavedGameOverlay from "./SavedGameOverlay";
import ScoreBoard from "./ScoreBoard";

const App: React.FC = observer(() => {
  const game = useGame();
  const { colorMode } = useColorMode();
  const [showModes, setShowModes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSavedGame, setShowSavedGame] = useState(false);

  useEffect(() => {
    // Check for saved game only after loading is complete
    if (!game.isLoading && game.hasSavedGame()) {
      setShowSavedGame(true);
    }
  }, [game, game.isLoading]);

  const handleRestart = () => {
    game.restart();
  };

  const handleRestoreSavedGame = async () => {
    const loaded = await game.loadSavedGame();
    if (loaded) {
      setShowSavedGame(false);
      // The game state should be properly synchronized after loading
    }
  };

  const handleStartFresh = () => {
    game.clearSavedGame();
    setShowSavedGame(false);
  };

  const handleShowModes = (show: boolean) => {
    if (show) {
      CrazyGames.pause();
    } else {
      CrazyGames.resume();
    }
    setShowModes(show);
  };

  const handleShowSettings = (show: boolean) => {
    if (show) {
      CrazyGames.pause();
    } else {
      CrazyGames.resume();
    }
    setShowSettings(show);
  };

  const oscillationLength = 40;

  return (
    <Center
      bgGradient={
        colorMode === "dark"
          ? "linear(to-t, gray.800, gray.900)"
          : "linear(to-t,rgb(129, 205, 255), #3b82f6)"
      }
      position="relative"
      sx={{
        minH: "100vh",
        "@supports (height: 100svh)": {
          minH: "100svh",
        },
      }}>
      {/* Loading Overlay */}
      <LoadingOverlay progress={game.loadingProgress} isVisible={game.isLoading} />

      {/* Saved Game Overlay */}
      {showSavedGame && <SavedGameOverlay onRestore={handleRestoreSavedGame} onStartFresh={handleStartFresh} />}

      {/* Score Board - positioned at top */}
      <Box position="absolute" top={0} left="50%" transform="translateX(-50%)" zIndex={10} w="100%">
        <ScoreBoard setShowSettings={handleShowSettings} setShowLeaderboard={setShowLeaderboard} />
      </Box>

      {/* Character Progression - positioned at bottom */}
      <Box position="absolute" bottom={5} left="50%" transform="translateX(-50%)" zIndex={10}>
        <CharacterProgression setShowModes={handleShowModes} setShowSettings={handleShowSettings} />
      </Box>

      {showModes && <GameModeOverlay setShowModes={handleShowModes} />}
      {showSettings && <GameSettingsOverlay setShowSettings={handleShowSettings} />}
      {showLeaderboard && <LeaderboardOverlay setShowLeaderboard={setShowLeaderboard} />}
      <GameOverOverlay onRestart={handleRestart} />

      {/* Game Canvas Container - centered */}
      <Box position="relative">
        <GameCanvas />

        {!game.hasStarted && !game.isLoading && (
          <VStack
            textAlign="center"
            h="58px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, calc(-50% + 20px))"
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
