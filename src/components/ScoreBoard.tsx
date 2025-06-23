import React from "react";
import { HStack, Text, Box, Image } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useGameStore } from "../stores/StoreContext";
import { useCharacterImage } from "../hooks/useCharacterImage";

const ScoreBoard: React.FC = observer(() => {
  const gameStore = useGameStore();
  const nextCharacterImage = useCharacterImage(gameStore.nextCharacter?.name || null);

  return (
    <HStack w="400px" justify="space-between" p={4} bg="whiteAlpha.200" borderRadius="lg" backdropFilter="blur(10px)" boxShadow="lg">
      <Text color="white" fontWeight="bold" fontSize="lg">
        Score: {gameStore.displayScore}
      </Text>
      <HStack spacing={2} align="center">
        <Text color="white" fontWeight="bold" fontSize="lg">
          Next:
        </Text>
        {gameStore.isLoading ? (
          <Text color="white" fontSize="md">
            Loading...
          </Text>
        ) : gameStore.nextCharacter && nextCharacterImage ? (
          <Box w="60px" h="60px" overflow="hidden" display="flex" alignItems="center" justifyContent="center">
            <Image
              src={nextCharacterImage}
              alt={gameStore.nextCharacter.displayName}
              w="100%"
              h="100%"
              objectFit="cover"
              onError={(e) => {
                // Fallback to colored circle if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.style.backgroundColor = "#ff6b6b";
              }}
            />
          </Box>
        ) : (
          <Text color="white" fontSize="md">
            None
          </Text>
        )}
      </HStack>
    </HStack>
  );
});

export default ScoreBoard;
