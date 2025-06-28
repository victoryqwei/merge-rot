import React from "react";
import { HStack, Text, Box, Image, VStack, Button } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useGame } from "../game/useGame";
import { useCharacterImage } from "../hooks/useCharacterImage";
import { AiOutlineHome } from "react-icons/ai";
import { GameMode } from "../constants/GameConstants";
import ShakeButton from "./ShakeButton";
import { BiCog } from "react-icons/bi";

interface ScoreBoardProps {
  setShowSettings: (showSettings: boolean) => void;
}

const ScoreBoard: React.FC<ScoreBoardProps> = observer(({ setShowSettings }) => {
  const game = useGame();
  const nextCharacterImage = useCharacterImage(game.nextCharacter?.name || null);

  const getCurrentModeDisplayName = () => {
    switch (game.getGameMode()) {
      case GameMode.ITALIAN_BRAINROT:
        return "Italian Brainrot";
      case GameMode.CATS:
        return "Cats";
      default:
        return "Unknown";
    }
  };

  return (
    <HStack maxW="500px" w="100%" justify="space-between" p={4} h="100px" px={10} mx="auto">
      {game.hasStarted && (
        <HStack>
          <Button
            variant="unstyled"
            color="white"
            fontWeight="bold"
            onClick={() => (window.location.href = "/")}
            _hover={{ color: "whiteAlpha.800" }}
            transition="color 0.2s"
            flexShrink={0}>
            <AiOutlineHome size={32} />
          </Button>
          <Button
            variant="unstyled"
            color="white"
            fontWeight="bold"
            onClick={() => setShowSettings(true)}
            _hover={{ color: "whiteAlpha.800" }}
            transition="color 0.2s"
            flexShrink={0}>
            <BiCog size={32} />
          </Button>
        </HStack>
      )}

      <Text color="white" fontWeight="bold" fontSize={"4xl"} textAlign="center" flex={1} px={2} whiteSpace="nowrap">
        {game.hasStarted ? `${game.getScore()}` : `- ${getCurrentModeDisplayName()} -`}
      </Text>

      {game.hasStarted && game.nextCharacter && nextCharacterImage && (
        <VStack spacing={2} align="center" flexShrink={0} transform={"translateY(40px)"}>
          <VStack spacing={1} align="center">
            <Box
              w={{ base: "40px", md: "60px" }}
              h={{ base: "40px", md: "60px" }}
              overflow="hidden"
              display="flex"
              alignItems="center"
              justifyContent="center">
              <Image
                src={nextCharacterImage}
                alt={game.nextCharacter.displayName}
                maxW="100%"
                maxH="100%"
                objectFit="contain"
                onError={(e) => {
                  // Fallback to colored circle if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.parentElement!.style.backgroundColor = "#ff6b6b";
                }}
              />
            </Box>
            <Text color="white" fontWeight="bold" fontSize={{ base: "sm", md: "lg" }}>
              Next
            </Text>
          </VStack>
          <ShakeButton />
        </VStack>
      )}
    </HStack>
  );
});

export default ScoreBoard;
