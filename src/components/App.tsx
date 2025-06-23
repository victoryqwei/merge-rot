import React, { useEffect, useRef, useState } from "react";
import { Box, Text, Button, VStack, HStack, Center, useToast } from "@chakra-ui/react";
import { SuikaGame } from "../game/SuikaGame";
import type { CharacterType } from "../types/GameTypes";

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<SuikaGame | null>(null);
  const [score, setScore] = useState(0);
  const [nextCharacter, setNextCharacter] = useState<CharacterType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initGame = async () => {
      setIsLoading(true);

      // Initialize the game
      gameRef.current = new SuikaGame(canvas);

      // Set up game callbacks
      gameRef.current.setScoreCallback((newScore: number) => {
        setScore(newScore);
      });

      gameRef.current.setNextCharacterCallback((character: CharacterType) => {
        setNextCharacter(character);
      });

      gameRef.current.setGameOverCallback(() => {
        setGameOver(true);
        toast({
          title: "Game Over!",
          description: `Final Score: ${score}`,
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      });

      // Game is already initialized in constructor
      setIsLoading(false);
    };

    initGame();

    return () => {
      // Cleanup will be handled by the game itself
    };
  }, [toast]);

  const handleRestart = () => {
    if (gameRef.current) {
      gameRef.current.restart();
      setScore(0);
      setGameOver(false);
    }
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-br, blue.400, purple.600)" display="flex" justifyContent="center" alignItems="center" p={4}>
      <VStack spacing={6} align="center">
        {/* Score Board */}
        <HStack w="400px" justify="space-between" p={4} bg="whiteAlpha.200" borderRadius="lg" backdropFilter="blur(10px)" boxShadow="lg">
          <Text color="white" fontWeight="bold" fontSize="lg">
            Score: {score}
          </Text>
          <Text color="white" fontWeight="bold" fontSize="lg">
            Next: {isLoading ? "Loading..." : nextCharacter?.name || "None"}
          </Text>
        </HStack>

        {/* Game Canvas Container */}
        <Box position="relative" borderRadius="lg" overflow="hidden" boxShadow="xl">
          <canvas
            ref={canvasRef}
            width={400}
            height={600}
            style={{
              display: "block",
              cursor: "crosshair",
              background: "#f0f0f0",
            }}
          />

          {/* Loading Overlay */}
          {isLoading && (
            <Center
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="blackAlpha.700"
              color="white"
              fontSize="xl"
              fontWeight="bold">
              Loading...
            </Center>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
            <Center position="absolute" top={0} left={0} right={0} bottom={0} bg="blackAlpha.800">
              <VStack spacing={4} p={8} bg="whiteAlpha.100" borderRadius="xl" backdropFilter="blur(10px)">
                <Text fontSize="3xl" fontWeight="bold" color="white">
                  Game Over!
                </Text>
                <Text fontSize="xl" color="white">
                  Final Score: {score}
                </Text>
                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={handleRestart}
                  _hover={{ transform: "translateY(-2px)" }}
                  transition="all 0.3s">
                  Play Again
                </Button>
              </VStack>
            </Center>
          )}
        </Box>

        {/* Controls */}
        <VStack spacing={2} color="white" textAlign="center">
          <Text fontSize="md">Click to drop characters</Text>
          <Text fontSize="md">Combine same characters to score points!</Text>
        </VStack>
      </VStack>
    </Box>
  );
};

export default App;
