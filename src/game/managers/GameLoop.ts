export interface GameLoopCallbacks {
  update: (deltaTime: number) => Promise<void>;
  draw: () => void;
}

export class GameLoop {
  private callbacks: GameLoopCallbacks;
  private lastFrameTime: number = 0;
  private deltaTime: number = 0;
  private isRunning: boolean = false;
  private isPageVisible: boolean = true;

  constructor(callbacks: GameLoopCallbacks) {
    this.callbacks = callbacks;
    this.setupVisibilityHandling();
  }

  private setupVisibilityHandling(): void {
    // Handle page visibility changes
    document.addEventListener("visibilitychange", () => {
      this.isPageVisible = !document.hidden;
      if (this.isPageVisible) {
        // Reset lastFrameTime when page becomes visible to prevent large deltaTime
        this.lastFrameTime = 0;
      }
    });

    // Handle window blur/focus events as backup
    window.addEventListener("blur", () => {
      this.isPageVisible = false;
    });

    window.addEventListener("focus", () => {
      this.isPageVisible = true;
      // Reset lastFrameTime when window regains focus to prevent large deltaTime
      this.lastFrameTime = 0;
    });
  }

  start(): void {
    this.isRunning = true;
    this.lastFrameTime = 0;
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();

    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
    }

    this.deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds

    this.lastFrameTime = currentTime;

    this.callbacks.update(this.deltaTime).then(() => {
      this.callbacks.draw();
      requestAnimationFrame(() => this.gameLoop());
    });
  }

  getDeltaTime(): number {
    return this.deltaTime;
  }
}
