import { Box, Button, HStack, Image } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React from "react";
import { useGame } from "../game/useGame";
import { useCharacterImage } from "../hooks/useCharacterImage";
import { CharacterClass } from "../types/GameTypes";
import { BiJoystick } from "react-icons/bi";

interface CharacterProgressionProps {
  setShowModes: (showModes: boolean) => void;
}

const CharacterProgression: React.FC<CharacterProgressionProps> = observer(({ setShowModes }) => {
  const game = useGame();
  const currentGameMode = game.getGameMode();
  const allCharacters = CharacterClass.getAllCharacters(currentGameMode);

  if (!game.hasStarted) {
    return (
      <Button
        colorScheme="green"
        size="md"
        onClick={() => setShowModes(true)}
        border="2px solid white"
        iconSpacing={1}
        paddingX={2}
        leftIcon={<BiJoystick size={24} />}>
        Modes
      </Button>
    );
  }

  return (
    <Box maxW="100vw" overflow="hidden">
      <HStack spacing={1} justify="center" bg="whiteAlpha.400" borderRadius="full" px={2} maxW="100%" minW="fit-content">
        {allCharacters.map((character: CharacterClass, index: number) => (
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

const CharacterItem: React.FC<CharacterItemProps> = ({ character }) => {
  const characterImage = useCharacterImage(character.name);

  return (
    <Box
      h={"50px"}
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
