import React, { useState, useEffect } from "react";
import { Center, VStack, Text, Button, Slider, SliderTrack, SliderFilledTrack, SliderThumb, HStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useGame } from "../game/useGame";

interface SettingsOverlayProps {
  setShowSettings: (showSettings: boolean) => void;
}

interface VolumeControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  minLabel: string;
}

const VolumeControl: React.FC<VolumeControlProps> = ({ label, value, onChange, min, max, step, displayValue, minLabel }) => (
  <VStack spacing={3} w="100%">
    <Text fontSize="lg" color="white" fontWeight="semibold">
      {label}
    </Text>
    <HStack w="100%" spacing={4}>
      <Text fontSize="sm" color="white" minW="40px">
        {minLabel}
      </Text>
      <Slider value={value} onChange={onChange} min={min} max={max} step={step} colorScheme="purple" size="lg">
        <SliderTrack bg="whiteAlpha.300">
          <SliderFilledTrack bg="purple.400" />
        </SliderTrack>
        <SliderThumb bg="purple.500" border="2px solid white" />
      </Slider>
      <Text fontSize="sm" color="white" minW="40px">
        {displayValue}
      </Text>
    </HStack>
  </VStack>
);

const GameSettingsOverlay: React.FC<SettingsOverlayProps> = observer(({ setShowSettings }) => {
  const game = useGame();
  const [musicVolume, setMusicVolume] = useState(game.getMusicVolume());
  const [sfxVolume, setSfxVolume] = useState(game.getSFXVolume());
  const [gameBoxScale, setGameBoxScale] = useState(game.getGameBoxScale());

  useEffect(() => {
    setMusicVolume(game.getMusicVolume());
    setSfxVolume(game.getSFXVolume());
    setGameBoxScale(game.getGameBoxScale());
  }, [game]);

  const volumeControls = [
    {
      label: "Music Volume",
      value: musicVolume,
      onChange: (value: number) => {
        setMusicVolume(value);
        game.setMusicVolume(value);
      },
      min: 0,
      max: 1,
      step: 0.01,
      displayValue: `${Math.round(musicVolume * 100)}%`,
      minLabel: "0%",
    },
    {
      label: "SFX Volume",
      value: sfxVolume,
      onChange: (value: number) => {
        setSfxVolume(value);
        game.setSFXVolume(value);
      },
      min: 0,
      max: 1,
      step: 0.01,
      displayValue: `${Math.round(sfxVolume * 100)}%`,
      minLabel: "0%",
    },
    {
      label: "Game Box Size",
      value: gameBoxScale,
      onChange: (value: number) => {
        setGameBoxScale(value);
        game.setGameBoxScale(value);
      },
      min: 0.5,
      max: 1.5,
      step: 0.1,
      displayValue: `${Math.round(gameBoxScale * 100)}%`,
      minLabel: "50%",
    },
  ];

  return (
    <Center position="absolute" top={0} left={0} right={0} bottom={0} bg="blackAlpha.800" zIndex={10}>
      <VStack spacing={8} p={8} borderRadius="xl" maxW="400px" w="100%">
        <Text fontSize="3xl" fontWeight="bold" color="white" textAlign="center">
          Settings
        </Text>

        <VStack spacing={6} w="100%">
          {volumeControls.map((control) => (
            <VolumeControl key={control.label} {...control} />
          ))}
        </VStack>

        <VStack spacing={4} w="100%">
          <Text fontSize="3xl" fontWeight="bold" color="white" textAlign="center">
            How to Play
          </Text>
          <VStack spacing={2} w="100%">
            <Text fontSize="md" color="white" textAlign="center">
              • Drop to merge memes
            </Text>
            <Text fontSize="md" color="white" textAlign="center">
              • Get the top meme to win
            </Text>
          </VStack>
        </VStack>

        <Button
          colorScheme="gray"
          size="lg"
          _hover={{ transform: "translateY(-2px)" }}
          transition="all 0.3s"
          onClick={() => setShowSettings(false)}
          variant="outline"
          borderColor="white"
          color="white">
          Back
        </Button>
      </VStack>
    </Center>
  );
});

export default GameSettingsOverlay;
