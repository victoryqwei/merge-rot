import * as Matter from "matter-js";
import type { Character } from "../types/GameTypes";
import { GAME_CONFIG, PHYSICS } from "../constants/GameConstants";

export class PhysicsEngine {
  private engine: Matter.Engine;
  private world: Matter.World;
  private bodies: Matter.Body[] = [];
  private gameOverTimer: number = 0;
  private gameOverDelay: number = 2;
  private collisionDetector: Matter.Detector;

  constructor() {
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;

    // Set up world properties
    this.world.gravity.y = PHYSICS.GRAVITY;

    // Create collision detector
    this.collisionDetector = Matter.Detector.create({
      bodies: [],
    });

    // Create boundaries
    this.createBoundaries();
  }

  private createBoundaries(): void {
    const thickness = 20;

    // Left wall
    const leftWall = Matter.Bodies.rectangle(
      -thickness / 2 + GAME_CONFIG.PADDING + 5,
      GAME_CONFIG.BOX_HEIGHT / 2,
      thickness,
      GAME_CONFIG.BOX_HEIGHT,
      {
        isStatic: true,
      }
    );

    // Right wall
    const rightWall = Matter.Bodies.rectangle(
      GAME_CONFIG.BOX_WIDTH + thickness / 2 + GAME_CONFIG.PADDING - 5,
      GAME_CONFIG.BOX_HEIGHT / 2,
      thickness,
      GAME_CONFIG.BOX_HEIGHT,
      { isStatic: true }
    );

    // Floor
    const floor = Matter.Bodies.rectangle(
      GAME_CONFIG.BOX_WIDTH / 2,
      GAME_CONFIG.BOX_HEIGHT + thickness / 2 - 5,
      GAME_CONFIG.BOX_WIDTH,
      thickness,
      { isStatic: true }
    );

    Matter.World.add(this.world, [leftWall, rightWall, floor]);
  }

  createCharacterBody(radius: number, x: number, y: number): Matter.Body {
    const body = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.3,
      friction: 0.9,
      density: 0.005,
      frictionAir: 0.05,
      slop: 0.01,
    });

    this.bodies.push(body);
    Matter.World.add(this.world, body);

    // Add body to collision detector
    this.collisionDetector.bodies.push(body);

    return body;
  }

  update(deltaTime: number): void {
    // Cap delta time to prevent large jumps when window regains focus
    const clampedDeltaTime = Math.min(deltaTime, GAME_CONFIG.MAX_DELTA_TIME * 1000);

    Matter.Engine.update(this.engine, clampedDeltaTime);
  }

  getBodyPosition(body: Matter.Body): { x: number; y: number } {
    return {
      x: body.position.x,
      y: body.position.y,
    };
  }

  getBodyVelocity(body: Matter.Body): { x: number; y: number } {
    return {
      x: body.velocity.x,
      y: body.velocity.y,
    };
  }

  getBodyRotation(body: Matter.Body): number {
    return body.angle;
  }

  checkCollision(character1: Character, character2: Character): boolean {
    // Use Matter.js collision detection
    const pairs = Matter.Detector.collisions(this.collisionDetector);

    // Check if the two characters are colliding
    for (const pair of pairs) {
      if (
        (pair.bodyA.id === character1.body.id && pair.bodyB.id === character2.body.id) ||
        (pair.bodyA.id === character2.body.id && pair.bodyB.id === character1.body.id)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all current collision pairs for efficient batch processing
   */
  getAllCollisionPairs(): Array<{ bodyA: Matter.Body; bodyB: Matter.Body }> {
    return Matter.Detector.collisions(this.collisionDetector);
  }

  removeBody(body: Matter.Body): void {
    Matter.World.remove(this.world, body);

    // Remove from collision detector
    const detectorIndex = this.collisionDetector.bodies.indexOf(body);
    if (detectorIndex > -1) {
      this.collisionDetector.bodies.splice(detectorIndex, 1);
    }

    // Remove from bodies array
    const index = this.bodies.indexOf(body);
    if (index > -1) {
      this.bodies.splice(index, 1);
    }
  }

  addBodyToWorld(body: Matter.Body): void {
    this.bodies.push(body);
    Matter.World.add(this.world, body);
    this.collisionDetector.bodies.push(body);
  }

  getWorld(): Matter.World {
    return this.world;
  }

  getEngine(): Matter.Engine {
    return this.engine;
  }

  checkGameOver(deltaTime: number): boolean {
    // Check if any character is too high
    const characterAboveLine = this.bodies.filter((body) => body.position.y - body.circleRadius! < GAME_CONFIG.GAME_OVER_HEIGHT);

    if (characterAboveLine.length > 0) {
      const body = characterAboveLine[0];
      const velocity = Math.sqrt(body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y);

      // Only trigger game over if all characters have stopped moving AND timer has elapsed
      if (velocity < 0.5) {
        this.gameOverTimer += deltaTime;
        if (this.gameOverTimer >= this.gameOverDelay) {
          return true;
        }
      } else {
        // Reset timer if characters are still moving
        this.gameOverTimer = 0;
      }
    } else {
      // Reset timer if no characters are above the line
      this.gameOverTimer = 0;
    }

    return false;
  }

  clear(): void {
    for (const body of this.bodies) {
      Matter.World.remove(this.world, body);
    }
    this.bodies = [];
    this.collisionDetector.bodies = [];
    this.gameOverTimer = 0;
  }

  applyShake(shakeAngle: number, shakeVelocity: number): void {
    // Apply shake forces to all bodies based on the box movement
    for (const body of this.bodies) {
      // Calculate force based on shake angle and velocity
      const forceMultiplier = 0.01; // Adjust this to control force strength

      // Apply horizontal force based on shake angle (tilt effect)
      const horizontalForce = shakeAngle * forceMultiplier;

      // Apply vertical force based on shake velocity (acceleration effect)
      const verticalForce = shakeVelocity * forceMultiplier;

      // Apply forces to the body
      Matter.Body.applyForce(body, body.position, {
        x: horizontalForce,
        y: verticalForce,
      });

      // Apply angular velocity based on shake movement
      const angularForce = shakeVelocity * 0.01;
      Matter.Body.setAngularVelocity(body, body.angularVelocity + angularForce);
    }
  }
}
