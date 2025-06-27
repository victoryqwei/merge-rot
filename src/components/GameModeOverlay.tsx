import React from "react";
import { Center, VStack, Text, Button } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useGame } from "../game/useGame";
import { GameMode } from "../constants/GameConstants";

interface GameModeOverlayProps {
  setShowModes: (showModes: boolean) => void;
}

const GameModeOverlay: React.FC<GameModeOverlayProps> = observer(({ setShowModes }) => {
  const game = useGame();

  const handleModeClick = (mode: GameMode) => {
    game.setGameMode(mode);
    setShowModes(false);
  };

  const returnToGame = () => {
    setShowModes(false);
  };

  return (
    <Center position="absolute" top={0} left={0} right={0} bottom={0} bg="blackAlpha.800" zIndex={10}>
      <VStack spacing={6} p={8} borderRadius="xl" maxW="300px" w="100%">
        <Text fontSize="3xl" fontWeight="bold" color="white" textAlign="center">
          Select Game Mode
        </Text>

        <VStack spacing={4} w="100%">
          {[
            { mode: GameMode.ITALIAN_BRAINROT, label: "Italian Brainrot" },
            { mode: GameMode.CATS, label: "Cats" },
          ].map(({ mode, label }) => {
            return (
              <Button
                key={mode}
                w="100%"
                colorScheme={"purple"}
                size="lg"
                _hover={{ transform: "translateY(-2px)" }}
                transition="all 0.3s"
                onClick={() => handleModeClick(mode)}
                borderColor="white"
                color="white">
                {label}
              </Button>
            );
          })}
        </VStack>

        <Button
          colorScheme="gray"
          size="lg"
          _hover={{ transform: "translateY(-2px)" }}
          transition="all 0.3s"
          onClick={returnToGame}
          variant="outline"
          borderColor="white"
          color="white">
          Back
        </Button>
      </VStack>
    </Center>
  );
});

export default GameModeOverlay;
