import React from "react";
import { HStack, Text } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useGameStore } from "../stores/StoreContext";

const ScoreBoard: React.FC = observer(() => {
  const gameStore = useGameStore();

  return (
    <HStack w="400px" justify="space-between" p={4} bg="whiteAlpha.200" borderRadius="lg" backdropFilter="blur(10px)" boxShadow="lg">
      <Text color="white" fontWeight="bold" fontSize="lg">
        Score: {gameStore.displayScore}
      </Text>
      <Text color="white" fontWeight="bold" fontSize="lg">
        Next: {gameStore.nextCharacterName}
      </Text>
    </HStack>
  );
});

export default ScoreBoard;
