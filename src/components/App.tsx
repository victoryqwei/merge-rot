import React, { useEffect, useRef, useState } from "react";
import { SuikaGame } from "../game/SuikaGame";
import type { CharacterType } from "../types/GameTypes";
import "./App.css";

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<SuikaGame | null>(null);
  const [score, setScore] = useState(0);
  const [nextCharacter, setNextCharacter] = useState<CharacterType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initGame = async () => {
      setIsLoading(true);

      // Initialize the game
      gameRef.current = new SuikaGame(canvas);

      // Set up game callbacks
      gameRef.current.setScoreCallback((newScore: number) => {
        setScore(newScore);
      });

      gameRef.current.setNextCharacterCallback((character: CharacterType) => {
        setNextCharacter(character);
      });

      gameRef.current.setGameOverCallback(() => {
        setGameOver(true);
      });

      // Game is already initialized in constructor
      setIsLoading(false);
    };

    initGame();

    return () => {
      // Cleanup will be handled by the game itself
    };
  }, []);

  const handleRestart = () => {
    if (gameRef.current) {
      gameRef.current.restart();
      setScore(0);
      setGameOver(false);
    }
  };

  return (
    <div className="app">
      <div className="game-container">
        <div className="score-board">
          <div className="score">Score: {score}</div>
          <div className="next-character">Next: {isLoading ? "Loading..." : nextCharacter?.name || "None"}</div>
        </div>

        <div className="canvas-container">
          <canvas ref={canvasRef} width={400} height={600} className="game-canvas" />
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-text">Loading...</div>
            </div>
          )}
          {gameOver && (
            <div className="game-over-overlay">
              <div className="game-over-content">
                <h2>Game Over!</h2>
                <p>Final Score: {score}</p>
                <button onClick={handleRestart} className="restart-button">
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="controls">
          <p>Click to drop characters</p>
          <p>Combine same characters to score points!</p>
        </div>
      </div>
    </div>
  );
};

export default App;
