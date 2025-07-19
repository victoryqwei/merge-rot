import { Button } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import React from "react";
import { useGame } from "../game/useGame";

const PopButton: React.FC = observer(() => {
  const game = useGame();

  const handlePop = async () => {
    if (game.isPopMode()) {
      // Cancel pop mode if it's currently active
      game.cancelPopMode();
    } else if (game.canPop()) {
      const played = await game.cubicBezier.playRewardedAd();
      // Start pop mode if it's not active and cooldown is finished
      game.startPopMode();

      if (played) {
        game.popManager.resetPopCooldown();
      }
    }
  };

  // Use the actual game cooldown instead of local state
  const popCooldown = game.getPopCooldown();
  const isPopMode = game.isPopMode();
  const isShaking = game.getShakeAngle() !== 0;
  const isPopDisabled = popCooldown > 0 || !game.hasStarted || isShaking;

  // Determine button appearance based on state
  const getButtonColor = () => {
    if (popCooldown > 0) return "gray";
    if (isShaking) return "gray"; // Disabled due to shaking
    if (isPopMode) return "orange"; // Different color when pop mode is active
    return "red";
  };

  const getButtonText = () => {
    if (popCooldown > 0) return `${popCooldown}s`;
    if (isPopMode) return "Cancel";
    return "Pop!";
  };

  return (
    <Button
      colorScheme={getButtonColor()}
      w="80px"
      h="40px"
      size="md"
      onClick={handlePop}
      disabled={isPopDisabled}
      _hover={{ transform: isPopDisabled ? "none" : "scale(1.05)" }}
      transition="all 0.2s"
      border="2px solid white">
      {getButtonText()}
    </Button>
  );
});

export default PopButton;
