import { Box, HStack, Image } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React from "react";
import { useCharacterImage } from "../hooks/useCharacterImage";
import { CharacterClass } from "../types/GameTypes";

const CharacterProgression: React.FC = observer(() => {
  const allCharacters = CharacterClass.getAllCharacters();

  return (
    <HStack spacing={1} justify="center" flexWrap="wrap">
      {allCharacters.map((character, index) => (
        <CharacterItem key={character.name} character={character} index={index} totalCharacters={allCharacters.length} />
      ))}
    </HStack>
  );
});

interface CharacterItemProps {
  character: CharacterClass;
  index: number;
  totalCharacters: number;
}

const CharacterItem: React.FC<CharacterItemProps> = ({ character }) => {
  const characterImage = useCharacterImage(character.name);

  return (
    <Box h="40px" overflow="hidden" display="flex" alignItems="center" justifyContent="center" position="relative">
      {characterImage ? (
        <Image
          src={characterImage}
          alt={character.displayName}
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
      ) : (
        <Box w="30px" h="30px" borderRadius="full" bg="whiteAlpha.300" />
      )}
    </Box>
  );
};

export default CharacterProgression;
