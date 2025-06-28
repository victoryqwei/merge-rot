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
    <HStack
      spacing={1}
      justify="flex-start"
      bg="whiteAlpha.400"
      borderRadius="full"
      p={4}
      w="min(90vw, 500px)"
      overflowX="scroll"
      flexWrap="nowrap">
      {allCharacters.map((character: CharacterClass, index: number) => (
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
    <Box display="flex" alignItems="center" justifyContent="center" position="relative" flexShrink={0}>
      {characterImage ? (
        <Image
          src={characterImage}
          alt={character.displayName}
          h="2.5em"
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
