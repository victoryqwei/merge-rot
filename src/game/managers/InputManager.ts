import { clamp } from "lodash";
import { GAME_CONFIG } from "../../constants/GameConstants";
import { CharacterClass } from "../../types/GameTypes";

export interface InputState {
  mouseX: number;
  isDragging: boolean;
  isMobile: boolean;
}

export class InputManager {
  private canvas: HTMLCanvasElement | null = null;
  private currentCharacter: CharacterClass | null = null;
  private state: InputState = {
    mouseX: GAME_CONFIG.BOX_WIDTH / 2,
    isDragging: false,
    isMobile: false,
  };

  private onDrop?: () => Promise<void>;

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
      const mouseX = this.getMouseX(e.clientX);
      if (mouseX !== null) {
        this.state.mouseX = mouseX;
      }
    });

    // Add character on click
    this.canvas.addEventListener("click", async () => {
      if (this.onDrop) {
        await this.onDrop();
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
          const mouseX = this.getMouseX(e.touches[0].clientX);
          if (mouseX !== null) {
            this.state.mouseX = mouseX;
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

          const mouseX = this.getMouseX(e.touches[0].clientX);
          if (mouseX !== null) {
            this.state.mouseX = mouseX;
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
        if (this.state.isDragging && this.onDrop) {
          await this.onDrop();
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

  private getMouseX(clientX: number): number | null {
    const rect = this.canvas?.getBoundingClientRect();
    if (!rect) return null;

    let mouseX = clientX - rect.left - GAME_CONFIG.PADDING;

    // Constrain mouse position by character radius to prevent going past box boundaries
    if (this.currentCharacter) {
      const radius = this.currentCharacter.radius;
      mouseX = clamp(mouseX, radius, GAME_CONFIG.BOX_WIDTH - radius);
    }

    return mouseX + GAME_CONFIG.PADDING;
  }

  getCurrentMouseX(): number {
    return this.state.mouseX;
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
}
