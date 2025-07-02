import { Box, Button, HStack, Image, Tooltip } from "@chakra-ui/react";
import { clamp } from "lodash";
import { observer } from "mobx-react-lite";
import React, { useState, useEffect, useRef } from "react";
import { BiCog, BiJoystick } from "react-icons/bi";
import { useGame } from "../game/useGame";
import { useCharacterImage } from "../hooks/useCharacterImage";
import { CharacterClass } from "../types/GameTypes";

interface CharacterProgressionProps {
  setShowModes: (showModes: boolean) => void;
  setShowSettings: (showSettings: boolean) => void;
}

const CharacterProgression: React.FC<CharacterProgressionProps> = observer(({ setShowModes, setShowSettings }) => {
  const game = useGame();
  const currentGameMode = game.getGameMode();
  const allCharacters = CharacterClass.getAllCharacters(currentGameMode);

  if (!game.hasStarted) {
    return (
      <HStack>
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
        <Button
          paddingX={2}
          border="2px solid white"
          colorScheme="yellow"
          size="md"
          onClick={() => setShowSettings(true)}
          iconSpacing={1}
          leftIcon={<BiCog size={24} />}>
          Settings
        </Button>
      </HStack>
    );
  }

  return (
    <HStack
      spacing={1}
      justify="flex-start"
      bg="whiteAlpha.400"
      borderRadius="full"
      p={2}
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

const CharacterItem: React.FC<CharacterItemProps> = ({ character, index }) => {
  const characterImage = useCharacterImage(character.name);
  const game = useGame();
  const isMobile = game.getIsMobile();
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const size = `${clamp(2 + character.tier * 0.1, 2, 3.5)}em`;

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.stopPropagation();
      setShowTooltip(!showTooltip);
    }
  };

  const handleTooltipClose = () => {
    if (isMobile) {
      setShowTooltip(false);
    }
  };

  // Handle click away to close tooltip on mobile
  useEffect(() => {
    if (!isMobile || !showTooltip) return;

    const handleClickAway = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    document.addEventListener("mousedown", handleClickAway as EventListener);
    document.addEventListener("touchstart", handleClickAway as EventListener);

    return () => {
      document.removeEventListener("mousedown", handleClickAway as EventListener);
      document.removeEventListener("touchstart", handleClickAway as EventListener);
    };
  }, [isMobile, showTooltip]);

  return (
    <Tooltip label={character.displayName} isOpen={isMobile ? showTooltip : undefined} onClose={handleTooltipClose}>
      <Box
        ref={containerRef}
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        flexShrink={0}
        onClick={handleClick}
        cursor={isMobile ? "pointer" : "default"}
        sx={{
          WebkitTapHighlightColor: "transparent",
          "&:focus": {
            outline: "none",
            boxShadow: "none",
          },
        }}>
        {characterImage ? (
          <Image
            src={characterImage}
            alt={character.displayName}
            h={size}
            w={index === 0 ? size : "auto"}
            objectFit="contain"
            sx={{
              WebkitTapHighlightColor: "transparent",
              "&:focus": {
                outline: "none",
                boxShadow: "none",
              },
            }}
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
    </Tooltip>
  );
};

export default CharacterProgression;
