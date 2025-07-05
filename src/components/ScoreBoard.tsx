import { Box, Button, Flex, HStack, Image, Text, VStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React from "react";
import { AiOutlineHome } from "react-icons/ai";
import { BiBug, BiCog, BiTrophy } from "react-icons/bi";
import { GAME_MODE_LABELS } from "../constants/GameConstants";
import { useGame } from "../game/useGame";
import { useCharacterImage } from "../hooks/useCharacterImage";
import ShakeButton from "./ShakeButton";
import PopButton from "./PopButton";
import { FaFire } from "react-icons/fa";

interface ScoreBoardProps {
  setShowSettings: (showSettings: boolean) => void;
  setShowLeaderboard: (showLeaderboard: boolean) => void;
}

const ScoreBoard: React.FC<ScoreBoardProps> = observer(({ setShowSettings, setShowLeaderboard }) => {
  const game = useGame();
  const nextCharacterImage = useCharacterImage(game.nextCharacter?.name || null);

  const displayName = GAME_MODE_LABELS[game.getGameMode()].label;

  return (
    <Box position="relative" maxW="540px" w="100%" p={4} h="100px" px={10} mx="auto">
      {game.hasStarted && (
        <VStack
          position="absolute"
          left={10}
          top="50%"
          transform="translateY(calc(-50% + 24px))"
          zIndex={1}
          justifyContent="flex-start"
          textAlign="left">
          <HStack spacing={1}>
            <Button
              variant="unstyled"
              color="white"
              fontWeight="bold"
              onClick={() => game.restart()}
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

            {import.meta.env.MODE === "development" && (
              <>
                <Button
                  variant="unstyled"
                  color="white"
                  fontWeight="bold"
                  flexShrink={0}
                  onClick={() => setShowLeaderboard(true)}
                  _hover={{ color: "whiteAlpha.800" }}
                  transition="color 0.2s">
                  <BiTrophy size={32} />
                </Button>
                <Button
                  variant="unstyled"
                  color={game.isDebugMode() ? "yellow.400" : "white"}
                  fontWeight="bold"
                  onClick={() => game.toggleDebugMode()}
                  _hover={{ color: "whiteAlpha.800" }}
                  transition="color 0.2s"
                  flexShrink={0}>
                  <BiBug size={32} />
                </Button>
              </>
            )}
          </HStack>
          <Flex transform="translateY(12px)" justifyContent="flex-start" w="100%">
            <PopButton />
          </Flex>
        </VStack>
      )}

      {game.hasStarted && game.isComboDisplayVisible() && game.getComboMultiplier() > 1 && (
        <Text
          position="absolute"
          left="50%"
          top="50%"
          transform="translate(-50%, calc(50% + 20px))"
          color={
            game.getComboMultiplier() > 4
              ? "red.400"
              : game.getComboMultiplier() > 3
              ? "orange.400"
              : game.getComboMultiplier() > 2
              ? "yellow.400"
              : "white"
          }
          fontSize="xl"
          zIndex={1}
          display="flex"
          alignItems="center">
          Combo x{game.getComboMultiplier()}
          {game.getComboMultiplier() > 2 ? <FaFire style={{ marginLeft: "4px" }} /> : null}
        </Text>
      )}

      <Text
        color="white"
        fontWeight="bold"
        fontSize={"4xl"}
        textAlign="center"
        position="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, -50%)"
        whiteSpace="nowrap"
        w="100%"
        px={2}>
        {game.hasStarted ? `${game.getScore()}` : `- ${displayName} -`}
      </Text>

      {game.hasStarted && game.nextCharacter && nextCharacterImage && (
        <VStack
          position="absolute"
          right={10}
          top="50%"
          transform="translateY(calc(-50% + 28px))"
          spacing={2}
          align="center"
          flexShrink={0}
          zIndex={1}>
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
          </VStack>
          <ShakeButton />
        </VStack>
      )}
    </Box>
  );
});

export default ScoreBoard;
