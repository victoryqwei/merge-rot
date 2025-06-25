import React from "react";
import { HStack, Text, Box, Image, VStack, Button } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useGame } from "../game/useGame";
import { useCharacterImage } from "../hooks/useCharacterImage";
import { AiOutlineHome } from "react-icons/ai";

const ScoreBoard: React.FC = observer(() => {
  const game = useGame();
  const nextCharacterImage = useCharacterImage(game.nextCharacter?.name || null);

  return (
    <HStack maxW="500px" w="100%" justify="space-between" p={4} h="100px" px={10} mx="auto">
      {game.hasStarted && (
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
      )}

      <Text
        color="white"
        fontWeight="bold"
        fontSize={{ base: game.hasStarted ? "2xl" : "xl", md: game.hasStarted ? "4xl" : "3xl" }}
        textAlign="center"
        flex={1}
        px={2}>
        {game.hasStarted ? `${game.score}` : "- Italian Brainrot -"}
      </Text>

      {game.hasStarted && game.nextCharacter && nextCharacterImage && (
        <VStack spacing={1} align="center" flexShrink={0}>
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
      )}
    </HStack>
  );
});

export default ScoreBoard;
