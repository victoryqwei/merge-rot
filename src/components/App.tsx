import React from "react";
import { Box, VStack, Text, Button } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useGameService } from "../hooks/useGameService";
import ScoreBoard from "./ScoreBoard";
import GameCanvas from "./GameCanvas";
import GameOverOverlay from "./GameOverOverlay";

const App: React.FC = observer(() => {
  const gameService = useGameService();

  const handleRestart = () => {
    gameService.restartGame();
  };

  const handleShake = () => {
    gameService.shake();
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-br, blue.400, purple.600)" display="flex" justifyContent="center" alignItems="center" p={4}>
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
          <VStack spacing={2}>
            <Text fontSize="md">Click to drop characters</Text>
            <Text fontSize="md">Combine same characters to score points!</Text>
          </VStack>

          <Button colorScheme="orange" size="lg" onClick={handleShake} _hover={{ transform: "scale(1.05)" }} transition="all 0.2s">
            🥤 Shake!
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
});

export default App;
