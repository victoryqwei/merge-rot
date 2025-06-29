import * as Matter from "matter-js";
import { CharacterClass } from "../types/GameTypes";
import { PhysicsEngine } from "./PhysicsEngine";
import { ImageManager } from "./ImageManager";
import { ShapeDetector } from "./ShapeDetector";

export class BodyCache {
  private cache = new Map<string, Promise<Matter.Vector[]>>();
  private physicsEngine: PhysicsEngine;
  private imageManager: ImageManager;

  constructor(physicsEngine: PhysicsEngine, imageManager: ImageManager) {
    this.physicsEngine = physicsEngine;
    this.imageManager = imageManager;
  }

  /**
   * Get a cached body for a character type, or create and cache a new one
   */
  async getBody(characterType: CharacterClass, x: number, y: number): Promise<Matter.Body> {
    const image = this.imageManager.getImage(characterType.name);

    const cacheKey = this.getCacheKey(characterType);

    // Get or create the cached detectImageShape promise
    let shapePromise = this.cache.get(cacheKey);
    if (!shapePromise) {
      // Cache the detectImageShape function call
      console.debug(`BodyCache: Cache miss for ${cacheKey}, calling detectImageShape`);
      shapePromise = ShapeDetector.detectImageShape(image!, characterType.radius);
      this.cache.set(cacheKey, shapePromise);
    } else {
      console.debug(`BodyCache: Cache hit for ${cacheKey}, using cached detectImageShape result`);
    }

    // Wait for the shape detection to complete
    const vertices = await shapePromise;

    return this.createBodyFromVertices(vertices, x, y);
  }

  /**
   * Create a body using cached vertices
   */
  private createBodyFromVertices(vertices: Matter.Vector[], x: number, y: number): Matter.Body {
    // Create polygon body from cached vertices, translated to the new position
    const translatedVertices = vertices.map((vertex) => ({
      x: vertex.x + x,
      y: vertex.y + y,
    }));

    const body = Matter.Bodies.fromVertices(
      x,
      y,
      [translatedVertices],
      {
        restitution: 0.7,
        friction: 0.8,
        density: 0.001,
      },
      true,
      0.01,
      10
    );

    // Add the body to the physics world and tracking
    this.physicsEngine.addBodyToWorld(body);

    return body;
  }

  /**
   * Generate a cache key for a character type
   */
  private getCacheKey(characterType: CharacterClass): string {
    return `${characterType.name}_${characterType.radius}`;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
  }
}
