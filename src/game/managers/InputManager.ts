import { clamp } from "lodash";
import { GAME_CONFIG } from "../../constants/GameConstants";
import { CharacterClass } from "../../types/GameTypes";
import { SocketManager } from "../../utils/SocketManager";

export interface InputState {
  mouseX: number;
  mouseY: number;
  isDragging: boolean;
  isMobile: boolean;
}

export class InputManager {
  private canvas: HTMLCanvasElement | null = null;
  private currentCharacter: CharacterClass | null = null;
  private state: InputState = {
    mouseX: GAME_CONFIG.BOX_WIDTH / 2,
    mouseY: GAME_CONFIG.CANVAS_HEIGHT / 2,
    isDragging: false,
    isMobile: false,
  };

  private onDrop?: () => Promise<void>;
  private onPop?: (x: number, y: number) => void;
  private isPopModeActive?: () => boolean;
  private socketManager: SocketManager | null = null;

  constructor() {
    this.detectMobile();
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  setCurrentCharacter(character: CharacterClass | null): void {
    this.currentCharacter = character;
  }

  setOnDrop(callback: () => Promise<void>): void {
    this.onDrop = callback;
  }

  setOnPop(callback: (x: number, y: number) => void): void {
    this.onPop = callback;
  }

  setIsPopModeActive(callback: () => boolean): void {
    this.isPopModeActive = callback;
  }

  setSocketManager(socketManager: SocketManager): void {
    this.socketManager = socketManager;
  }

  private detectMobile(): void {
    this.state.isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  private setupEventListeners(): void {
    if (this.state.isMobile) {
      this.setupMobileEvents();
    } else {
      this.setupDesktopEvents();
    }
  }

  private setupDesktopEvents(): void {
    if (!this.canvas) return;

    // Track mouse movement
    this.canvas.addEventListener("mousemove", (e) => {
      const mousePos = this.getMousePosition(e.clientX, e.clientY);
      if (mousePos) {
        this.state.mouseX = mousePos.x;
        this.state.mouseY = mousePos.y;
      }
    });

    // Add character on click or handle pop
    this.canvas.addEventListener("click", async (e) => {
      const mousePos = this.getMousePosition(e.clientX, e.clientY);
      if (mousePos) {
        // Check if we're in pop mode
        if (this.isPopModeActive && this.isPopModeActive() && this.onPop) {
          this.onPop(mousePos.x, mousePos.y);
        } else {
          await this.handleDrop(mousePos.x);
        }
      }
    });

    // Handle clicks outside canvas for pop mode cancellation
    document.addEventListener("click", (e) => {
      if (this.canvas && !this.canvas.contains(e.target as Node)) {
        // Don't cancel pop mode if clicking on UI elements (buttons, inputs, etc.)
        const target = e.target as HTMLElement;
        if (
          target.tagName === "BUTTON" ||
          target.closest("button") ||
          target.closest('[role="button"]') ||
          target.closest(".chakra-button") ||
          target.closest("[data-ui-element]")
        ) {
          return; // Don't cancel pop mode for UI interactions
        }

        if (this.isPopModeActive && this.isPopModeActive() && this.onPop) {
          this.onPop(-1, -1); // Signal outside canvas click
        }
      }
    });
  }

  private setupMobileEvents(): void {
    if (!this.canvas) return;

    // Track touch movement
    this.canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault(); // Prevent scrolling
        if (e.touches.length > 0) {
          const mousePos = this.getMousePosition(e.touches[0].clientX, e.touches[0].clientY);
          if (mousePos) {
            this.state.mouseX = mousePos.x;
            this.state.mouseY = mousePos.y;
          }
        }
      },
      { passive: false }
    );

    // Start drag on touch start
    this.canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
          this.state.isDragging = true;

          const mousePos = this.getMousePosition(e.touches[0].clientX, e.touches[0].clientY);
          if (mousePos) {
            this.state.mouseX = mousePos.x;
            this.state.mouseY = mousePos.y;
          }
        }
      },
      { passive: false }
    );

    // End drag and drop on touch end
    this.canvas.addEventListener(
      "touchend",
      async (e) => {
        e.preventDefault();
        if (this.state.isDragging) {
          // Check if we're in pop mode
          if (this.isPopModeActive && this.isPopModeActive() && this.onPop) {
            this.onPop(this.state.mouseX, this.state.mouseY);
          } else {
            await this.handleDrop(this.state.mouseX);
          }
          this.state.isDragging = false;
        }
      },
      { passive: false }
    );

    // Handle touch cancel
    this.canvas.addEventListener(
      "touchcancel",
      (e) => {
        e.preventDefault();
        this.state.isDragging = false;
      },
      { passive: false }
    );
  }

  private getMousePosition(clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = this.canvas?.getBoundingClientRect();
    if (!rect) return null;

    const yRatio = GAME_CONFIG.CANVAS_HEIGHT / rect.height;

    let mouseX = clientX - rect.left - GAME_CONFIG.PADDING + (clientX - window.innerWidth / 2) * (yRatio - 1);
    const mouseY = clientY - rect.top;

    // Constrain mouse position by character radius to prevent going past box boundaries
    if (this.currentCharacter) {
      const radius = this.currentCharacter.radius;
      mouseX = clamp(mouseX, radius, GAME_CONFIG.BOX_WIDTH - radius);
    }

    return {
      x: mouseX + GAME_CONFIG.PADDING,
      y: mouseY * yRatio,
    };
  }

  getCurrentMouseX(): number {
    return this.state.mouseX;
  }

  getCurrentMouseY(): number {
    return this.state.mouseY;
  }

  isDragging(): boolean {
    return this.state.isDragging;
  }

  isMobile(): boolean {
    return this.state.isMobile;
  }

  resetDragState(): void {
    this.state.isDragging = false;
  }

  private async handleDrop(x: number): Promise<void> {
    if (this.socketManager?.isConnected()) {
      // Send drop command to server
      this.socketManager.dropCharacter(x);
    } else if (this.onDrop) {
      // Use local drop logic
      await this.onDrop();
    }
  }
}
