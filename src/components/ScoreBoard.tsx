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
    <HStack w="400px" justify="space-between" p={4} h="100px">
      <Box>
        <Button
          variant="unstyled"
          color="white"
          fontSize="2xl"
          fontWeight="bold"
          onClick={() => (window.location.href = "/")}
          _hover={{ color: "whiteAlpha.800" }}
          transition="color 0.2s">
          <AiOutlineHome size={24} />
        </Button>
      </Box>

      <Text color="white" fontWeight="bold" fontSize="xl" textAlign="center" w="100%">
        {game.score === 0 ? "- Italian Brainrot -" : `${game.score}`}
      </Text>
      <VStack spacing={1} align="center">
        {game.hasStarted && game.nextCharacter && nextCharacterImage ? (
          <>
            <Box w="60px" h="60px" overflow="hidden" display="flex" alignItems="center" justifyContent="center">
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
            <Text color="white" fontWeight="bold" fontSize="lg">
              Next
            </Text>
          </>
        ) : (
          <Box w="60px" h="60px" overflow="hidden" display="flex" alignItems="center" justifyContent="center"></Box>
        )}
      </VStack>
    </HStack>
  );
});

export default ScoreBoard;
