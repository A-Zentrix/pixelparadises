import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Play, Pause, RotateCcw } from "lucide-react";
import BackButton from "@/components/BackButton";

type Point = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";

const GRID_SIZE = 20;
const CELL_SIZE = 24;
const INITIAL_SPEED = 150;
const MIN_SPEED = 80;
const SPEED_INCREASE = 3;

export default function Snake() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ]);
  const [direction, setDirection] = useState<Direction>("right");
  const [nextDirection, setNextDirection] = useState<Direction>("right");
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => 
    parseInt(localStorage.getItem("snake_high_score") || "0")
  );
  const [gameState, setGameState] = useState<"playing" | "paused" | "gameOver">("playing");
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  // Generate random food position that doesn't overlap with snake
  const generateFood = useCallback((snakeBody: Point[]): Point => {
    let newFood: Point;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (snakeBody.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  // Check collision with walls or self
  const checkCollision = useCallback((head: Point, body: Point[]): boolean => {
    // Only check self collision, walls will wrap around
    return body.some(segment => segment.x === head.x && segment.y === head.y);
  }, []);

  // Move snake and handle game logic
  const moveSnake = useCallback(() => {
    if (gameState !== "playing") return;

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      // Update direction
      setDirection(nextDirection);

      // Move head based on direction with wall wrapping
      switch (nextDirection) {
        case "up":
          head.y = head.y <= 0 ? GRID_SIZE - 1 : head.y - 1;
          break;
        case "down":
          head.y = head.y >= GRID_SIZE - 1 ? 0 : head.y + 1;
          break;
        case "left":
          head.x = head.x <= 0 ? GRID_SIZE - 1 : head.x - 1;
          break;
        case "right":
          head.x = head.x >= GRID_SIZE - 1 ? 0 : head.x + 1;
          break;
      }

      // Check collision
      if (checkCollision(head, newSnake)) {
        setGameState("gameOver");
        if (score > highScore) {
          const newHighScore = score;
          setHighScore(newHighScore);
          localStorage.setItem("snake_high_score", newHighScore.toString());
        }
        return prevSnake;
      }

      // Add new head
      newSnake.unshift(head);

      // Check if food eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          setSpeed(prevSpeed => Math.max(MIN_SPEED, prevSpeed - SPEED_INCREASE));
          return newScore;
        });
        setFood(generateFood(newSnake));
      } else {
        // Remove tail if no food eaten
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameState, nextDirection, food, score, highScore, checkCollision, generateFood]);

  // Game loop
  useEffect(() => {
    const gameLoop = (currentTime: number) => {
      if (gameState === "playing" && currentTime - lastTimeRef.current >= speed) {
        lastTimeRef.current = currentTime;
        moveSnake();
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, speed, moveSnake]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState === "gameOver") return;

      const key = e.key.toLowerCase();
      switch (key) {
        case "arrowup":
        case "w":
          if (direction !== "down") setNextDirection("up");
          break;
        case "arrowdown":
        case "s":
          if (direction !== "up") setNextDirection("down");
          break;
        case "arrowleft":
        case "a":
          if (direction !== "right") setNextDirection("left");
          break;
        case "arrowright":
        case "d":
          if (direction !== "left") setNextDirection("right");
          break;
        case " ":
          e.preventDefault();
          setGameState(prev => prev === "playing" ? "paused" : "playing");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [direction, gameState]);

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasSize = GRID_SIZE * CELL_SIZE;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear canvas
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw grid
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvasSize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvasSize, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(food.x * CELL_SIZE + 2, food.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);

    // Draw snake
    snake.forEach((segment, index) => {
      if (index === 0) {
        // Head
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(segment.x * CELL_SIZE + 1, segment.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        
        // Eyes
        ctx.fillStyle = "#ffffff";
        const eyeSize = 4;
        const eyeOffset = 6;
        ctx.fillRect(segment.x * CELL_SIZE + eyeOffset, segment.y * CELL_SIZE + eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, segment.y * CELL_SIZE + eyeOffset, eyeSize, eyeSize);
      } else {
        // Body
        const alpha = Math.max(0.3, 1 - (index * 0.1));
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
        ctx.fillRect(segment.x * CELL_SIZE + 2, segment.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      }
    });
  }, [snake, food]);

  // Redraw when snake or food changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Reset game
  const resetGame = () => {
    setSnake([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ]);
    setDirection("right");
    setNextDirection("right");
    setFood(generateFood([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ]));
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameState("playing");
  };

  // Toggle pause
  const togglePause = () => {
    if (gameState === "gameOver") return;
    setGameState(prev => prev === "playing" ? "paused" : "playing");
  };

  return (
    <div className="glass-card rounded-3xl p-6 max-w-2xl mx-auto" data-testid="snake-game">
      <div className="mb-4">
        <BackButton />
      </div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-3xl font-bold">Snake Game</h1>
        <div className="text-right">
          <div className="text-white/80 text-sm">Score: {score}</div>
          <div className="text-white/60 text-xs">High Score: {highScore}</div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="border-2 border-white/20 rounded-lg"
            style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
          />
          {gameState === "paused" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="text-white text-xl font-bold">PAUSED</div>
            </div>
          )}
          {gameState === "gameOver" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="text-center">
                <div className="text-white text-xl font-bold mb-2">GAME OVER</div>
                <div className="text-white/80 text-sm">Final Score: {score}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={togglePause}
          disabled={gameState === "gameOver"}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg transition-colors"
        >
          {gameState === "playing" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {gameState === "playing" ? "Pause" : "Resume"}
        </button>
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Direction Controls */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="text-white/80 text-sm font-medium">Direction Controls</div>
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <button
            onClick={() => setNextDirection("up")}
            disabled={direction === "down" || gameState !== "playing"}
            className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div></div>
          <button
            onClick={() => setNextDirection("left")}
            disabled={direction === "right" || gameState !== "playing"}
            className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div></div>
          <button
            onClick={() => setNextDirection("right")}
            disabled={direction === "left" || gameState !== "playing"}
            className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div></div>
          <button
            onClick={() => setNextDirection("down")}
            disabled={direction === "up" || gameState !== "playing"}
            className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <div></div>
        </div>
      </div>

      {/* Instructions */}
      <motion.div 
        className="text-center text-white/70 text-sm space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div>Use arrow keys or WASD to control the snake</div>
        <div>Press SPACE to pause/resume the game</div>
        <div>Eat red food to grow and increase your score</div>
        <div>Snake wraps around walls - avoid hitting yourself!</div>
      </motion.div>
    </div>
  );
}


