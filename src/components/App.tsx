import { Box, Button, VStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React from "react";
import { useGameService } from "../hooks/useGameService";
import GameCanvas from "./GameCanvas";
import GameOverOverlay from "./GameOverOverlay";
import ScoreBoard from "./ScoreBoard";

const App: React.FC = observer(() => {
  const gameService = useGameService();

  const handleRestart = () => {
    gameService.restartGame();
  };

  const handleShake = () => {
    gameService.shake();
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-t,rgb(129, 205, 255), #3b82f6)"
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={4}>
      <VStack spacing={6} align="center">
        {/* Score Board */}
        <ScoreBoard />

        {/* Game Canvas Container */}
        <Box position="relative">
          <GameCanvas gameService={gameService} />
          <GameOverOverlay onRestart={handleRestart} />
        </Box>

        {/* Controls */}
        <VStack spacing={4} color="white" textAlign="center">
          <Button colorScheme="orange" size="lg" onClick={handleShake} _hover={{ transform: "scale(1.05)" }} transition="all 0.2s">
            🥤 Shake!
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
});

export default App;
