import * as Matter from "matter-js";

export class ShapeDetector {
  private static readonly CANVAS_SIZE = 100; // Size of temporary canvas for analysis
  private static readonly SAMPLE_RATE = 4; // Sample every Nth pixel for performance
  private static readonly MIN_POINTS = 8; // Minimum points for polygon
  private static readonly MAX_POINTS = 16; // Maximum points for polygon

  /**
   * Detects the shape of a character image and creates a physics body
   */
  static async createCharacterBodyFromImage(image: HTMLImageElement, x: number, y: number, radius: number): Promise<Matter.Body> {
    const points = await this.detectImageShape(image, radius);

    if (points.length < 3) {
      // Fallback to circle if shape detection fails
      return Matter.Bodies.circle(x, y, radius, {
        restitution: 0.7,
        friction: 0.8,
        density: 0.001,
      });
    }

    // Create polygon body
    const body = Matter.Bodies.fromVertices(
      x,
      y,
      [points],
      {
        restitution: 0.7,
        friction: 0.8,
        density: 0.001,
      },
      true,
      0.01,
      10
    );

    return body;
  }

  /**
   * Detects the shape of an image by analyzing non-transparent pixels
   */
  static async detectImageShape(image: HTMLImageElement, radius: number): Promise<Matter.Vector[]> {
    return new Promise((resolve) => {
      // Create temporary canvas for analysis
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      canvas.width = this.CANVAS_SIZE;
      canvas.height = this.CANVAS_SIZE;

      // Draw image scaled to canvas
      ctx.drawImage(image, 0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);

      // Get image data
      const imageData = ctx.getImageData(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
      const data = imageData.data;

      // Find non-transparent pixels
      const points: { x: number; y: number }[] = [];

      for (let y = 0; y < this.CANVAS_SIZE; y += this.SAMPLE_RATE) {
        for (let x = 0; x < this.CANVAS_SIZE; x += this.SAMPLE_RATE) {
          const index = (y * this.CANVAS_SIZE + x) * 4;
          const alpha = data[index + 3]; // Alpha channel

          if (alpha > 128) {
            // Non-transparent pixel
            points.push({ x, y });
          }
        }
      }

      if (points.length === 0) {
        resolve([]);
        return;
      }

      // Create convex hull from points
      const hull = this.createConvexHull(points);

      // Simplify hull to reduce complexity
      const simplified = this.simplifyPolygon(hull, this.MIN_POINTS, this.MAX_POINTS);

      // Convert to Matter.js vectors and scale back to original size
      const scaledPoints = simplified.map((point) => ({
        x: ((point.x - this.CANVAS_SIZE / 2) * (radius * 2)) / this.CANVAS_SIZE,
        y: ((point.y - this.CANVAS_SIZE / 2) * (radius * 2)) / this.CANVAS_SIZE,
      }));

      resolve(scaledPoints);
    });
  }

  /**
   * Creates a convex hull from a set of points using Graham scan algorithm
   */
  private static createConvexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
    if (points.length < 3) return points;

    // Find the point with the lowest y-coordinate (and leftmost if tied)
    let start = points[0];
    for (const point of points) {
      if (point.y < start.y || (point.y === start.y && point.x < start.x)) {
        start = point;
      }
    }

    // Sort points by polar angle with respect to start point
    const sorted = points
      .filter((p) => p !== start)
      .sort((a, b) => {
        const angleA = Math.atan2(a.y - start.y, a.x - start.x);
        const angleB = Math.atan2(b.y - start.y, b.x - start.x);
        return angleA - angleB;
      });

    // Graham scan
    const hull = [start];
    for (const point of sorted) {
      while (hull.length > 1 && this.crossProduct(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
        hull.pop();
      }
      hull.push(point);
    }

    return hull;
  }

  /**
   * Calculates the cross product of three points
   */
  private static crossProduct(p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }): number {
    return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  }

  /**
   * Simplifies a polygon by removing points while maintaining shape
   */
  private static simplifyPolygon(points: { x: number; y: number }[], minPoints: number, maxPoints: number): { x: number; y: number }[] {
    if (points.length <= minPoints) return points;

    // Douglas-Peucker algorithm for polygon simplification
    const tolerance = 2.0;
    const simplified = this.douglasPeucker(points, tolerance);

    // Ensure we have the right number of points
    if (simplified.length > maxPoints) {
      // Remove points evenly to reach maxPoints
      const step = simplified.length / maxPoints;
      const result = [];
      for (let i = 0; i < maxPoints; i++) {
        const index = Math.floor(i * step);
        result.push(simplified[index]);
      }
      return result;
    }

    return simplified;
  }

  /**
   * Douglas-Peucker algorithm for line simplification
   */
  private static douglasPeucker(points: { x: number; y: number }[], tolerance: number): { x: number; y: number }[] {
    if (points.length <= 2) return points;

    let maxDistance = 0;
    let maxIndex = 0;

    // Find the point with maximum distance from the line segment
    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.pointToLineDistance(points[i], points[0], points[points.length - 1]);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }

    if (maxDistance > tolerance) {
      // Recursively simplify
      const first = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const second = this.douglasPeucker(points.slice(maxIndex), tolerance);
      return [...first.slice(0, -1), ...second];
    } else {
      return [points[0], points[points.length - 1]];
    }
  }

  /**
   * Calculates the distance from a point to a line segment
   */
  private static pointToLineDistance(
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
  ): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }
}
