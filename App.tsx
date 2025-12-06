import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, HelpCircle, Brain, FastForward, Pause, Download, Code } from 'lucide-react';
import Tower from './components/Tower';
import { Disk, TowerId, Move } from './types';
import { getRecursiveSolution } from './services/solver';
import { getAiGuidance } from './services/geminiService';

const DEFAULT_DISKS = 3;
const MAX_DISKS = 7;
const MIN_DISKS = 3;
const ANIMATION_DELAY_MS = 600;

// Embed the JavaFX code string for download
const JAVA_CODE = `import javafx.application.Application;
import javafx.animation.SequentialTransition;
import javafx.animation.TranslateTransition;
import javafx.application.Platform;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.Spinner;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Pane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Rectangle;
import javafx.stage.Stage;
import javafx.util.Duration;

import java.util.ArrayList;
import java.util.List;
import java.util.Stack;

/**
 * A JavaFX implementation of the Tower of Hanoi.
 * Uses a recursive algorithm to generate the solution steps and 
 * visualizes them using JavaFX animations.
 */
public class TowerOfHanoi extends Application {

    private static final int TOWER_WIDTH = 10;
    private static final int TOWER_HEIGHT = 200;
    private static final int DISK_HEIGHT = 20;
    private static final int BASE_Y = 300;
    private static final int BASE_X_OFFSET = 100;
    private static final int TOWER_SPACING = 200;
    
    // Tower X positions: [Left, Middle, Right]
    private static final int[] TOWER_X = {
        BASE_X_OFFSET, 
        BASE_X_OFFSET + TOWER_SPACING, 
        BASE_X_OFFSET + (TOWER_SPACING * 2)
    };

    private Pane root;
    // We track the disks logically to calculate positions
    private List<Stack<Rectangle>> towers;
    private SequentialTransition solutionAnimation;

    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage primaryStage) {
        root = new Pane();
        root.setPrefSize(700, 450);
        
        // --- Setup UI ---
        VBox mainLayout = new VBox(20);
        mainLayout.setAlignment(Pos.CENTER);
        
        // Game Area
        Pane gamePane = new Pane();
        gamePane.setPrefSize(700, 350);
        drawBackground(gamePane);
        
        // Controls
        HBox controls = new HBox(15);
        controls.setAlignment(Pos.CENTER);
        
        Label lblDisks = new Label("Disks:");
        Spinner<Integer> diskSpinner = new Spinner<>(3, 8, 3);
        Button btnSolve = new Button("Recursive Auto-Solve");
        Button btnReset = new Button("Reset Game");
        
        controls.getChildren().addAll(lblDisks, diskSpinner, btnReset, btnSolve);
        
        root.getChildren().addAll(gamePane, controls);
        
        // --- Game Logic ---
        towers = new ArrayList<>();
        for (int i = 0; i < 3; i++) towers.add(new Stack<>());
        
        Runnable initGame = () -> {
            resetGame(gamePane, diskSpinner.getValue());
        };
        
        btnReset.setOnAction(e -> initGame.run());
        
        btnSolve.setOnAction(e -> {
            // Reset first to ensure clean state
            initGame.run();
            
            // 1. Generate moves using pure recursion
            List<Move> moves = new ArrayList<>();
            generateRecursiveSolution(diskSpinner.getValue(), 0, 2, 1, moves);
            
            // 2. Build Animation Sequence
            solutionAnimation = new SequentialTransition();
            
            // We need a temporary logical state to calculate animation paths
            // because the animation hasn't happened yet
            List<Stack<Rectangle>> tempState = new ArrayList<>();
            for(int i=0; i<3; i++) {
                tempState.add(new Stack<>());
                for(Rectangle r : towers.get(i)) {
                    tempState.get(i).push(r);
                }
            }
            
            for (Move move : moves) {
                Rectangle disk = tempState.get(move.from).pop();
                tempState.get(move.to).push(disk);
                
                // Calculate new visual position
                double endX = TOWER_X[move.to] - disk.getWidth() / 2;
                double endY = BASE_Y - (tempState.get(move.to).size() * DISK_HEIGHT);
                
                // Create Move Animation
                // Better approach for smooth animation:
                double startX = TOWER_X[move.from] - disk.getWidth() / 2;
                double startY = BASE_Y - ((tempState.get(move.from).size() + 1) * DISK_HEIGHT);
                
                double deltaX = endX - startX;
                double deltaY = endY - startY;
                
                // Up, Over, Down motion
                TranslateTransition t1 = new TranslateTransition(Duration.millis(200), disk);
                t1.setByY(-50); // Lift
                
                TranslateTransition t2 = new TranslateTransition(Duration.millis(300), disk);
                t2.setByX(deltaX); // Move Across
                
                TranslateTransition t3 = new TranslateTransition(Duration.millis(200), disk);
                t3.setByY(deltaY + 50); // Drop
                
                solutionAnimation.getChildren().addAll(t1, t2, t3);
            }
            
            solutionAnimation.play();
        });

        // Initialize
        initGame.run();

        Scene scene = new Scene(root);
        primaryStage.setTitle("Tower of Hanoi (JavaFX + Recursion)");
        primaryStage.show();
    }

    private void drawBackground(Pane pane) {
        Rectangle base = new Rectangle(600, 10, Color.DARKGRAY);
        base.setX(50);
        base.setY(BASE_Y);
        pane.getChildren().add(base);

        for (int i = 0; i < 3; i++) {
            Rectangle pole = new Rectangle(10, TOWER_HEIGHT, Color.GRAY);
            pole.setX(TOWER_X[i] - 5);
            pole.setY(BASE_Y - TOWER_HEIGHT);
            pole.setArcWidth(10);
            pole.setArcHeight(10);
            pane.getChildren().add(pole);
            
            Label label = new Label(i == 0 ? "Source" : i == 1 ? "Aux" : "Target");
            label.setLayoutX(TOWER_X[i] - 20);
            label.setLayoutY(BASE_Y + 20);
            pane.getChildren().add(label);
        }
    }

    private void resetGame(Pane pane, int numDisks) {
        if (solutionAnimation != null) solutionAnimation.stop();
        
        // Remove existing disks
        pane.getChildren().removeIf(n -> n instanceof Rectangle && ((Rectangle)n).getHeight() == DISK_HEIGHT);
        for(Stack<Rectangle> s : towers) s.clear();

        // Create new disks
        for (int i = numDisks; i >= 1; i--) {
            int width = 40 + (i * 25);
            Rectangle disk = new Rectangle(width, DISK_HEIGHT);
            // Gradient color effect
            disk.setFill(Color.hsb(i * 360.0 / numDisks, 0.7, 0.9));
            disk.setArcWidth(10);
            disk.setArcHeight(10);
            disk.setStroke(Color.BLACK);

            // Position
            double x = TOWER_X[0] - width / 2.0;
            double y = BASE_Y - ((numDisks - i + 1) * DISK_HEIGHT);
            
            disk.setX(x);
            disk.setY(y);
            
            towers.get(0).push(disk);
            pane.getChildren().add(disk);
        }
    }

    /**
     * Pure Recursive Algorithm to solve Tower of Hanoi.
     */
    private void generateRecursiveSolution(int n, int from, int to, int aux, List<Move> moves) {
        if (n == 0) return;
        
        // Move n-1 from Source to Aux
        generateRecursiveSolution(n - 1, from, aux, to, moves);
        
        // Move nth disk from Source to Target
        moves.add(new Move(from, to));
        
        // Move n-1 from Aux to Target
        generateRecursiveSolution(n - 1, aux, to, from, moves);
    }

    // Helper class for moves
    private static class Move {
        int from, to;
        public Move(int from, int to) { this.from = from; this.to = to; }
    }
}`;

const App: React.FC = () => {
  // --- State ---
  const [diskCount, setDiskCount] = useState<number>(DEFAULT_DISKS);
  
  // Towers are arrays of disk sizes. Index 0 is bottom, length-1 is top.
  const [towers, setTowers] = useState<Disk[][]>([
    Array.from({ length: DEFAULT_DISKS }, (_, i) => DEFAULT_DISKS - i), // [3, 2, 1]
    [],
    []
  ]);

  const [selectedTower, setSelectedTower] = useState<TowerId | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [isSolving, setIsSolving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [message, setMessage] = useState<string>("Goal: Move all disks to the rightmost tower.");
  const [aiThinking, setAiThinking] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [currentSolverMove, setCurrentSolverMove] = useState<string>("");

  // Solution queue for auto-solver
  const solutionRef = useRef<Move[]>([]);
  // Use ReturnType<typeof setTimeout> to handle both Node and Browser environments safely
  const solvingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Helpers ---

  const resetGame = useCallback((count: number = diskCount) => {
    setDiskCount(count);
    setTowers([
      Array.from({ length: count }, (_, i) => count - i),
      [],
      []
    ]);
    setSelectedTower(null);
    setMoveCount(0);
    setIsSolving(false);
    setIsPaused(false);
    setGameWon(false);
    setCurrentSolverMove("");
    setMessage("Goal: Move all disks to the rightmost tower.");
    solutionRef.current = [];
    if (solvingTimerRef.current) clearTimeout(solvingTimerRef.current);
  }, [diskCount]);

  const checkWin = useCallback((currentTowers: Disk[][]) => {
    if (currentTowers[2].length === diskCount) {
      setGameWon(true);
      setMessage("Congratulations! Puzzle Solved.");
      setIsSolving(false);
      setCurrentSolverMove("Recursion Complete.");
    }
  }, [diskCount]);

  const moveDisk = (from: TowerId, to: TowerId) => {
    setTowers(prev => {
      const newTowers = prev.map(t => [...t]);
      const disk = newTowers[from].pop();
      if (disk) {
        newTowers[to].push(disk);
      }
      checkWin(newTowers);
      return newTowers;
    });
    setMoveCount(c => c + 1);
  };

  const handleTowerClick = (towerId: TowerId) => {
    if (isSolving || gameWon) return;

    // Deselect if clicking the same tower
    if (selectedTower === towerId) {
      setSelectedTower(null);
      return;
    }

    // Select source
    if (selectedTower === null) {
      if (towers[towerId].length === 0) {
        setMessage("Select a tower with disks.");
        return;
      }
      setSelectedTower(towerId);
      setMessage("Select a destination tower.");
    } 
    // Attempt move
    else {
      const sourceDisk = towers[selectedTower][towers[selectedTower].length - 1];
      const targetDisk = towers[towerId].length > 0 ? towers[towerId][towers[towerId].length - 1] : Infinity;

      if (sourceDisk < targetDisk) {
        moveDisk(selectedTower, towerId);
        setSelectedTower(null);
        setMessage("Move successful.");
      } else {
        setMessage("Invalid move: Cannot place a larger disk on a smaller one.");
        setSelectedTower(null);
      }
    }
  };

  const downloadJava = () => {
    const blob = new Blob([JAVA_CODE], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TowerOfHanoi.java';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Auto Solver (Recursive) ---

  const startAutoSolve = () => {
    if (isSolving) {
        // Toggle Pause
        setIsPaused(!isPaused);
        return;
    }

    // If starting fresh or from a mid-game state, we reset to keep the recursive logic pure
    resetGame(diskCount);
    
    // Generate moves immediately for standard start position
    const moves = getRecursiveSolution(diskCount, 0, 2, 1);
    solutionRef.current = moves;
    setIsSolving(true);
    setIsPaused(false);
    setCurrentSolverMove("Starting Recursive Algorithm...");
  };

  // The Game Loop for Auto-Solving
  useEffect(() => {
    if (isSolving && !isPaused && !gameWon) {
      solvingTimerRef.current = setTimeout(() => {
        const nextMove = solutionRef.current.shift();
        if (nextMove) {
          moveDisk(nextMove.from, nextMove.to);
          if (nextMove.explanation) {
             setCurrentSolverMove(nextMove.explanation);
          }
        } else {
          setIsSolving(false); // No more moves
        }
      }, ANIMATION_DELAY_MS);
    }
    return () => {
      if (solvingTimerRef.current) clearTimeout(solvingTimerRef.current);
    };
  }, [isSolving, isPaused, gameWon, towers]);

  // --- AI Tutor ---

  const askAI = async () => {
    if (isSolving) return;
    setAiThinking(true);
    const advice = await getAiGuidance(towers, moveCount, "User requested help");
    setMessage(advice);
    setAiThinking(false);
  };

  // --- Render ---

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      
      {/* Header */}
      <header className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Recursive Tower of Hanoi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing algorithms with React & Tailwind
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
           {/* Disk Counter */}
           <div className="flex items-center space-x-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
            <span className="text-sm font-medium text-slate-400">Disks:</span>
            <button 
              disabled={isSolving || diskCount <= MIN_DISKS}
              onClick={() => resetGame(diskCount - 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded disabled:opacity-30"
            >
              -
            </button>
            <span className="font-mono font-bold w-4 text-center">{diskCount}</span>
            <button 
              disabled={isSolving || diskCount >= MAX_DISKS}
              onClick={() => resetGame(diskCount + 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded disabled:opacity-30"
            >
              +
            </button>
          </div>

          <button
            onClick={() => resetGame()}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors"
            title="Reset Game"
          >
            <RotateCcw className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-12 w-full max-w-5xl mx-auto">
        
        {/* Status Bar */}
        <div className="w-full mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 font-mono">
              Moves: <span className="text-indigo-400">{moveCount}</span>
            </div>
            <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 font-mono text-xs md:text-sm">
              Min Moves (2ⁿ-1): <span className="text-emerald-400">{Math.pow(2, diskCount) - 1}</span>
            </div>
          </div>
          
          <div className="flex-1 w-full md:w-auto flex justify-center md:justify-end">
            <div className={`
              px-6 py-3 rounded-xl border flex items-center gap-3 transition-all duration-500
              ${aiThinking ? 'bg-indigo-900/30 border-indigo-500/50 animate-pulse' : 'bg-slate-800 border-slate-700'}
            `}>
              {aiThinking ? (
                <Brain className="w-5 h-5 text-indigo-400 animate-bounce" />
              ) : (
                <HelpCircle className="w-5 h-5 text-slate-400" />
              )}
              <span className="text-sm font-medium text-slate-200">
                {message}
              </span>
            </div>
          </div>
        </div>

        {/* Solver Status (Visible only when solving) */}
        <div className={`
           mb-4 h-6 text-center font-mono text-sm text-amber-400 transition-opacity duration-300
           ${isSolving ? 'opacity-100' : 'opacity-0'}
        `}>
           {currentSolverMove}
        </div>

        {/* Towers Container */}
        <div className="w-full flex justify-between items-end gap-4 md:gap-12 relative h-[350px]">
          {towers.map((disks, index) => (
            <Tower
              key={index}
              id={index as TowerId}
              disks={disks}
              totalDisks={diskCount}
              isSelected={selectedTower === index}
              isSource={selectedTower === index}
              onTowerClick={handleTowerClick}
            />
          ))}
          
          {/* Victory Overlay */}
          {gameWon && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 rounded-xl">
               <div className="text-center p-8 bg-slate-800 border border-emerald-500/50 rounded-2xl shadow-2xl transform animate-in zoom-in duration-300">
                 <h2 className="text-3xl font-bold text-emerald-400 mb-2">Solved!</h2>
                 <p className="text-slate-300 mb-6">Ideally in {Math.pow(2, diskCount) - 1} moves.</p>
                 <button 
                  onClick={() => resetGame()}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                 >
                   Play Again
                 </button>
               </div>
            </div>
          )}
        </div>

      </main>

      {/* Control Footer */}
      <footer className="p-6 bg-slate-800 border-t border-slate-700">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
            
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={startAutoSolve}
                disabled={gameWon}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all
                  ${isSolving && !isPaused
                    ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isSolving ? (
                   isPaused ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>
                ) : (
                   <><FastForward className="w-4 h-4" /> Recursive Auto-Solve</>
                )}
              </button>

              <button
                onClick={askAI}
                disabled={isSolving || gameWon}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors border border-slate-600 disabled:opacity-50"
              >
                <Brain className="w-4 h-4" />
                Ask AI Tutor
              </button>
              
              <button
                onClick={downloadJava}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-900 hover:bg-black text-slate-400 font-medium transition-colors border border-slate-700"
              >
                <Code className="w-4 h-4" />
                <Download className="w-4 h-4" />
                Download JavaFX Source
              </button>
            </div>

            <div className="text-xs text-slate-500 font-mono">
                Recursive Algorithm: Move(n-1, src, aux) → Move(1, src, tgt) → Move(n-1, aux, tgt)
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;