import { Box, HStack, Image, Text } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React from "react";
import { useCharacterImage } from "../hooks/useCharacterImage";
import { CharacterClass } from "../types/GameTypes";
import { useGame } from "../game/useGame";

const CharacterProgression: React.FC = observer(() => {
  const allCharacters = CharacterClass.getAllCharacters();
  const game = useGame();

  // Show "Touch to play" if game hasn't started yet
  if (!game.hasStarted) {
    return (
      <Box textAlign="center" p={3} h="58px" display="flex" alignItems="center" justifyContent="center">
        <Text color="white" fontSize="4xl" fontWeight="bold">
          TOUCH TO PLAY
        </Text>
      </Box>
    );
  }

  return (
    <Box maxW="100vw" overflow="hidden" px={8}>
      <HStack spacing={1} justify="center" bg="whiteAlpha.400" borderRadius="full" p={2} maxW="100%" minW="fit-content">
        {allCharacters.map((character, index) => (
          <CharacterItem key={character.name} character={character} index={index} totalCharacters={allCharacters.length} />
        ))}
      </HStack>
    </Box>
  );
});

interface CharacterItemProps {
  character: CharacterClass;
  index: number;
  totalCharacters: number;
}

const CharacterItem: React.FC<CharacterItemProps> = ({ character, index, totalCharacters }) => {
  const characterImage = useCharacterImage(character.name);

  const isLastCharacter = index === totalCharacters - 1;

  return (
    <Box
      h={isLastCharacter ? "50px" : "40px"}
      w="auto"
      minW="20px"
      maxW="50px"
      overflow="hidden"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative">
      {characterImage ? (
        <Image
          src={characterImage}
          alt={character.displayName}
          maxW="100%"
          maxH="100%"
          w="auto"
          h="auto"
          objectFit="contain"
          onError={(e) => {
            // Fallback to colored circle if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            target.parentElement!.style.backgroundColor = "#ff6b6b";
          }}
        />
      ) : (
        <Box w="30px" h="30px" borderRadius="full" bg="whiteAlpha.300" />
      )}
    </Box>
  );
};

export default CharacterProgression;
