import { Box, Text } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React from "react";
import { useGame } from "../game/useGame";
import { FaHammer } from "react-icons/fa";

const PopBanner: React.FC = observer(() => {
  const game = useGame();

  if (!game.isPopMode()) {
    return null;
  }

  return (
    <Box
      position="absolute"
      top="10px"
      left="50%"
      transform="translateX(-50%)"
      width="280px"
      height="60px"
      background="#ff8e53"
      borderRadius="30px"
      border="4px solid #fff"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex="10"
      pointerEvents="none"
      animation="popBounce 0.5s ease-out"
      sx={{
        "@keyframes popBounce": {
          "0%": {
            transform: "translateX(-50%) scale(0.8) translateY(-20px)",
            opacity: 0,
          },
          "50%": {
            transform: "translateX(-50%) scale(1.1) translateY(0px)",
            opacity: 1,
          },
          "100%": {
            transform: "translateX(-50%) scale(1) translateY(0px)",
            opacity: 1,
          },
        },
      }}>
      <Text
        color="white"
        fontSize="xl"
        fontWeight="900"
        letterSpacing="0.5px"
        textTransform="uppercase"
        display="flex"
        alignItems="center"
        gap="5px">
        <FaHammer /> Tap Any Item! <FaHammer />
      </Text>
    </Box>
  );
});

export default PopBanner;
