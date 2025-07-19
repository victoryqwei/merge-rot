import { Button } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useGame } from "../game/useGame";

const ShakeButton: React.FC = observer(() => {
  const game = useGame();

  const [shakeAngle, setShakeAngle] = useState(0);
  const [shakeCooldown, setShakeCooldown] = useState(0);

  const handleShake = async () => {
    if (shakeCooldown === 0) {
      const played = await game.cubicBezier.playVideoAd(true);
      setShakeCooldown(played ? 0 : 15); // Start 15 second cooldown
      game.shake();
    }
  };

  const isShakeDisabled = shakeCooldown > 0 || shakeAngle !== 0 || !game.hasStarted || game.isPopMode();

  useEffect(() => {
    let animationFrame: number;
    function updateShake() {
      setShakeAngle(game.getShakeAngle());
      animationFrame = requestAnimationFrame(updateShake);
    }
    updateShake();
    return () => cancelAnimationFrame(animationFrame);
  }, [game]);

  // Handle shake cooldown timer
  useEffect(() => {
    if (shakeCooldown > 0) {
      const timer = setTimeout(() => {
        setShakeCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shakeCooldown]);

  return (
    <Button
      colorScheme={shakeCooldown > 0 ? "gray" : "green"}
      w="80px"
      h="40px"
      size="md"
      onClick={handleShake}
      disabled={isShakeDisabled}
      _hover={{ transform: shakeCooldown > 0 ? "none" : "scale(1.05)" }}
      transition="all 0.2s"
      border="2px solid white">
      {shakeCooldown > 0 ? `${shakeCooldown}s` : "Shake!"}
    </Button>
  );
});

export default ShakeButton;
