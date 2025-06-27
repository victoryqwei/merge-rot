import React, { useState, useRef, useEffect } from "react";
import { SuikaGame } from "../game/SuikaGame";
import { GameMode } from "../constants/GameConstants";

export const GameModeExample: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<SuikaGame | null>(null);
  const [currentGameMode, setCurrentGameMode] = useState<GameMode>(GameMode.ITALIAN_BRAINROT);

  useEffect(() => {
    if (canvasRef.current) {
      // Create game with default game mode (Italian Brainrot)
      const newGame = new SuikaGame(canvasRef.current, currentGameMode);
      setGame(newGame);

      return () => {
        // Cleanup
        newGame.stopBackgroundMusic();
      };
    }
  }, []);

  const changeGameMode = (newGameMode: GameMode) => {
    if (game) {
      game.setGameMode(newGameMode);
      setCurrentGameMode(newGameMode);
    }
  };

  const restartGame = () => {
    if (game) {
      game.restart();
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Suika Game - Game Mode Example</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>Current Game Mode: {currentGameMode}</h2>

        <div style={{ marginBottom: "10px" }}>
          <button
            onClick={() => changeGameMode(GameMode.ITALIAN_BRAINROT)}
            style={{
              marginRight: "10px",
              padding: "10px 15px",
              backgroundColor: currentGameMode === GameMode.ITALIAN_BRAINROT ? "#4CAF50" : "#ddd",
              color: currentGameMode === GameMode.ITALIAN_BRAINROT ? "white" : "black",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}>
            Italian Brainrot Mode
          </button>

          <button
            onClick={() => changeGameMode(GameMode.CATS)}
            style={{
              padding: "10px 15px",
              backgroundColor: currentGameMode === GameMode.CATS ? "#4CAF50" : "#ddd",
              color: currentGameMode === GameMode.CATS ? "white" : "black",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}>
            Cats Mode
          </button>
        </div>

        <button
          onClick={restartGame}
          style={{
            padding: "10px 15px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}>
          Restart Game
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <p>
          <strong>Score:</strong> {game?.getScore() || 0}
        </p>
        <p>
          <strong>Current Character:</strong> {game?.currentCharacter?.displayName || "None"}
        </p>
        <p>
          <strong>Next Character:</strong> {game?.nextCharacter?.displayName || "None"}
        </p>
        <p>
          <strong>Game Over:</strong> {game?.gameOver ? "Yes" : "No"}
        </p>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          border: "2px solid #333",
          borderRadius: "5px",
          display: "block",
        }}
      />

      <div style={{ marginTop: "20px" }}>
        <h3>How to Play:</h3>
        <ul>
          <li>Click or drag to drop characters</li>
          <li>Combine same characters to evolve them</li>
          <li>Try both game modes to see different character sets!</li>
        </ul>

        <h3>Game Modes:</h3>
        <ul>
          <li>
            <strong>Italian Brainrot:</strong> Features Italian-themed characters like "Trippi Troppi", "Capuccino Assassino", etc.
          </li>
          <li>
            <strong>Cats:</strong> Features cat-themed characters from "Paw" to "Cat 9"
          </li>
        </ul>
      </div>
    </div>
  );
};
