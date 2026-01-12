
// 🛠️ Pernganuan Standard Game Library
// Use these utilities to ensure consistent physics and behavior across games.

/**
 * Standard Axis-Aligned Bounding Box (AABB) Collision.
 * Checks if two rectangles overlap.
 */
export const checkCollision = (
    r1: { x: number, y: number, w: number, h: number },
    r2: { x: number, y: number, w: number, h: number }
): boolean => {
    return (
        r1.x < r2.x + r2.w &&
        r1.x + r1.w > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.h > r2.y
    );
};

/**
 * Circle-Rectangle Collision (useful for ball vs paddle).
 */
export const checkCircleRect = (
    circle: { x: number, y: number, r: number },
    rect: { x: number, y: number, w: number, h: number }
): boolean => {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);

    if (distX > (rect.w / 2 + circle.r)) return false;
    if (distY > (rect.h / 2 + circle.r)) return false;

    if (distX <= (rect.w / 2)) return true;
    if (distY <= (rect.h / 2)) return true;

    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return (dx * dx + dy * dy <= (circle.r * circle.r));
};

/**
 * Get a random float between min and max.
 */
export const randomRange = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
};

/**
 * Get a random integer between min and max (inclusive).
 */
export const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Pick a random element from an array.
 */
export const randomChoice = <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Constrain a value between min and max.
 */
export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

/**
 * Linear Interpolation (Smooth transition between values).
 * t should be between 0 and 1.
 */
export const lerp = (start: number, end: number, t: number): number => {
    return start * (1 - t) + end * t;
};

/**
 * Check if the user is on a mobile device (Simple/Naive check).
 * Useful for adjusting UI scale or difficulty.
 */
export const isMobile = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};
