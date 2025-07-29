import React from "react";
import { Center, VStack, Text, Button, Image, HStack, Flex } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useGame } from "../game/useGame";
import { GameMode, GAME_MODE_LABELS } from "../constants/GameConstants";
import { useCharacterImage } from "../hooks/useCharacterImage";

interface GameModeOverlayProps {
  setShowModes: (showModes: boolean) => void;
}

const GameModeOverlay: React.FC<GameModeOverlayProps> = observer(({ setShowModes }) => {
  const game = useGame();

  const handleModeClick = async (mode: GameMode) => {
    await game.setGameMode(mode);
    setShowModes(false);

    game.cubicBezier.playVideoAd(true);
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
          {Object.entries(GAME_MODE_LABELS).map(([mode, { label, colorScheme, imageName }]) => {
            const image = useCharacterImage(imageName);

            return (
              <Button
                key={mode}
                w="100%"
                colorScheme={colorScheme}
                size="lg"
                _hover={{ transform: "translateY(-2px)" }}
                transition="all 0.3s"
                onClick={() => handleModeClick(mode as GameMode)}
                borderColor="white"
                color="white"
                p={2}>
                <HStack justifyContent="space-between" w="100%">
                  <Flex w="100%" justifyContent="center">
                    <Text
                      fontSize="xl"
                      fontWeight="bold"
                      p={2}
                      borderRadius="md"
                      style={{
                        WebkitTextStroke: "0.5px black",
                        textShadow: "0.5px 0.5px 0 black, -0.5px -0.5px 0 black, 0.5px -0.5px 0 black, -0.5px 0.5px 0 black",
                      }}>
                      {label}
                    </Text>
                  </Flex>

                  <Image src={image || ""} alt={label} w="40px" h="40px" objectFit="contain" />
                </HStack>
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
