import React from "react";
import { Center, VStack, Text, Button } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useGame } from "../game/useGame";

interface GameOverOverlayProps {
  onRestart: () => void;
}

const GameOverOverlay: React.FC<GameOverOverlayProps> = observer(({ onRestart }) => {
  const game = useGame();

  if (!game.gameOver) {
    return null;
  }

  return (
    <Center position="absolute" top={0} left={0} right={0} bottom={0} bg="blackAlpha.600">
      <VStack spacing={4} p={8} bg="whiteAlpha.200" borderRadius="xl" backdropFilter="blur(5px)">
        <Text fontSize="3xl" fontWeight="bold" color="white">
          Game Over!
        </Text>
        <Text fontSize="xl" color="white">
          Final Score: {game.getScore()}
        </Text>
        <Button colorScheme="blue" size="lg" onClick={onRestart} _hover={{ transform: "translateY(-2px)" }} transition="all 0.3s">
          Play Again
        </Button>
      </VStack>
    </Center>
  );
});

export default GameOverOverlay;
