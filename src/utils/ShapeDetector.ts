import * as Matter from "matter-js";

export class ShapeDetector {
  private static readonly MIN_CANVAS_SIZE = 100; // Minimum canvas size for analysis
  private static readonly MAX_CANVAS_SIZE = 200; // Maximum canvas size for analysis
  private static readonly SAMPLE_RATE = 1; // Sample every Nth pixel for performance
  private static readonly MIN_POINTS = 8; // Minimum points for polygon
  private static readonly MAX_POINTS = 48; // Maximum points for polygon
  private static readonly ALPHA_THRESHOLD = 128; // Alpha threshold for non-transparent pixels
  private static readonly EDGE_DETECTION_THRESHOLD = 64; // Threshold for edge detection

  /**
   * Detects the shape of an image by analyzing non-transparent pixels
   */
  static async detectImageShape(image: HTMLImageElement, radius: number): Promise<Matter.Vector[]> {
    return new Promise((resolve) => {
      // First, detect the content bounds of the image
      const bounds = this.detectContentBounds(image);

      if (!bounds) {
        // Fallback: create a simple circle if no content detected
        resolve(this.createFallbackShape(radius));
        return;
      }

      // Calculate optimal canvas size based on content
      const contentWidth = bounds.right - bounds.left;
      const contentHeight = bounds.bottom - bounds.top;
      const maxDimension = Math.max(contentWidth, contentHeight);

      // Scale canvas size based on content size, but keep within bounds
      const canvasSize = Math.max(this.MIN_CANVAS_SIZE, Math.min(this.MAX_CANVAS_SIZE, maxDimension * 2));

      // Create temporary canvas for analysis
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      canvas.width = canvasSize;
      canvas.height = canvasSize;

      // Calculate scaling and offset to fit content in canvas
      const ratio = 0.9;
      const scale = Math.min((canvasSize * ratio) / contentWidth, (canvasSize * ratio) / contentHeight);

      const offsetX = (canvasSize - contentWidth * scale) / 2;
      const offsetY = (canvasSize - contentHeight * scale) / 2;

      // Clear canvas and draw only the content area
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      ctx.drawImage(
        image,
        bounds.left,
        bounds.top,
        contentWidth,
        contentHeight,
        offsetX,
        offsetY,
        contentWidth * scale,
        contentHeight * scale
      );

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
      const data = imageData.data;

      // Find non-transparent pixels with edge detection
      const points = this.detectEdgePoints(data, canvasSize);

      if (points.length === 0) {
        // Fallback: create a simple circle if no points detected
        resolve(this.createFallbackShape(radius));
        return;
      }

      // Create convex hull from points
      const hull = this.createConvexHull(points);

      // Simplify hull to reduce complexity
      const simplified = this.simplifyPolygon(hull, this.MIN_POINTS, this.MAX_POINTS);

      // Convert to Matter.js vectors and scale back to original size
      const scaledPoints = simplified.map((point) => ({
        x: ((point.x - canvasSize / 2) * (radius * 2)) / canvasSize,
        y: ((point.y - canvasSize / 2) * (radius * 2)) / canvasSize,
      }));

      resolve(scaledPoints);
    });
  }

  /**
   * Detects the bounds of non-transparent content in the image
   */
  private static detectContentBounds(image: HTMLImageElement): { left: number; top: number; right: number; bottom: number } | null {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let left = canvas.width;
    let top = canvas.height;
    let right = 0;
    let bottom = 0;
    let hasContent = false;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3];

        if (alpha > this.ALPHA_THRESHOLD) {
          hasContent = true;
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
    }

    if (!hasContent) {
      return null;
    }

    // Add small padding to ensure we capture the full shape
    const padding = Math.max(2, Math.min(canvas.width, canvas.height) * 0.02);

    return {
      left: Math.max(0, left - padding),
      top: Math.max(0, top - padding),
      right: Math.min(canvas.width - 1, right + padding),
      bottom: Math.min(canvas.height - 1, bottom + padding),
    };
  }

  /**
   * Detects edge points from image data using gradient analysis
   */
  private static detectEdgePoints(data: Uint8ClampedArray, canvasSize: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const visited = new Set<string>();

    for (let y = 1; y < canvasSize - 1; y += this.SAMPLE_RATE) {
      for (let x = 1; x < canvasSize - 1; x += this.SAMPLE_RATE) {
        const index = (y * canvasSize + x) * 4;
        const alpha = data[index + 3];

        if (alpha > this.ALPHA_THRESHOLD) {
          // Check if this is an edge pixel by looking at neighbors
          const isEdge = this.isEdgePixel(data, x, y, canvasSize);

          if (isEdge) {
            const key = `${x},${y}`;
            if (!visited.has(key)) {
              visited.add(key);
              points.push({ x, y });
            }
          }
        }
      }
    }

    // If we don't have enough edge points, fall back to all non-transparent pixels
    if (points.length < this.MIN_POINTS) {
      points.length = 0;
      visited.clear();

      for (let y = 0; y < canvasSize; y += this.SAMPLE_RATE) {
        for (let x = 0; x < canvasSize; x += this.SAMPLE_RATE) {
          const index = (y * canvasSize + x) * 4;
          const alpha = data[index + 3];

          if (alpha > this.ALPHA_THRESHOLD) {
            const key = `${x},${y}`;
            if (!visited.has(key)) {
              visited.add(key);
              points.push({ x, y });
            }
          }
        }
      }
    }

    return points;
  }

  /**
   * Determines if a pixel is on the edge of the shape
   */
  private static isEdgePixel(data: Uint8ClampedArray, x: number, y: number, canvasSize: number): boolean {
    const centerIndex = (y * canvasSize + x) * 4;
    const centerAlpha = data[centerIndex + 3];

    // Check 8 neighbors
    const neighbors = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < canvasSize && ny >= 0 && ny < canvasSize) {
        const neighborIndex = (ny * canvasSize + nx) * 4;
        const neighborAlpha = data[neighborIndex + 3];

        // If neighbor is significantly more transparent, this is an edge
        if (Math.abs(centerAlpha - neighborAlpha) > this.EDGE_DETECTION_THRESHOLD) {
          return true;
        }
      }
    }

    return false;
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

  /**
   * Creates a fallback circular shape when detection fails
   */
  private static createFallbackShape(radius: number): Matter.Vector[] {
    const segments = 16;
    const points: Matter.Vector[] = [];

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      points.push({
        x: Math.cos(angle) * radius * 0.8,
        y: Math.sin(angle) * radius * 0.8,
      });
    }

    return points;
  }
}
