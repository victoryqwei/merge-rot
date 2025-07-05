import { Button } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useGame } from "../game/useGame";

const PopButton: React.FC = observer(() => {
  const game = useGame();

  const [popCooldown, setPopCooldown] = useState(0);

  const handlePop = () => {
    if (game.canPop()) {
      game.startPopMode();
      setPopCooldown(15);
    }
  };

  // Handle shake cooldown timer
  useEffect(() => {
    if (popCooldown > 0) {
      const timer = setTimeout(() => {
        setPopCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [popCooldown]);

  const isPopDisabled = popCooldown > 0 || !game.hasStarted;

  return (
    <Button
      colorScheme={popCooldown > 0 ? "gray" : "red"}
      w="80px"
      h="40px"
      size="md"
      onClick={handlePop}
      disabled={isPopDisabled}
      _hover={{ transform: popCooldown > 0 ? "none" : "scale(1.05)" }}
      transition="all 0.2s"
      border="2px solid white">
      {popCooldown > 0 ? `${popCooldown}s` : "Pop!"}
    </Button>
  );
});

export default PopButton;
