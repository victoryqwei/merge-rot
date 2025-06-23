import { SuikaGame } from "./game/SuikaGame";

// Extend Window interface to include restartGame function
declare global {
  interface Window {
    restartGame: () => void;
  }
}

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
  if (!canvas) {
    throw new Error("Canvas element not found");
  }

  const game = new SuikaGame(canvas);

  // Set up UI callbacks
  game.setScoreCallback((score: number) => {
    const scoreElement = document.getElementById("score");
    if (scoreElement) {
      scoreElement.textContent = score.toString();
    }
  });

  game.setNextCharacterCallback((character) => {
    const nextCharacterElement = document.getElementById("next-fruit");
    if (nextCharacterElement) {
      nextCharacterElement.textContent = character.name;
    }
  });

  game.setGameOverCallback((finalScore: number) => {
    const finalScoreElement = document.getElementById("finalScore");
    const gameOverElement = document.getElementById("gameOver");

    if (finalScoreElement) {
      finalScoreElement.textContent = finalScore.toString();
    }
    if (gameOverElement) {
      gameOverElement.style.display = "block";
    }
  });

  // Make restart function globally available
  window.restartGame = () => {
    const gameOverElement = document.getElementById("gameOver");
    if (gameOverElement) {
      gameOverElement.style.display = "none";
    }
    game.restart();
  };
});
