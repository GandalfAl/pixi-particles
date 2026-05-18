import { Behaviour } from "../../behaviour";
import { PxParticle } from "../../px-particle";

/**
 * Sets a particle's angular velocity at spawn time.
 *
 * Does NOT modify rotation per frame directly.
 * Instead, it initializes `angleV`, which the emitter integrates each tick.
 *
 * Supports:
 *
 * - Fixed value:
 *    2
 *
 * - Random range:
 *    { min: -3, max: 3 }
 *
 * - Random range with minimum absolute magnitude:
 *    { min: -3, max: 3, minAbs: 2 }
 *
 *    Result:
 *      [-3 .. -2] U [2 .. 3]
 */
export class StaticRotationBehaviour implements Behaviour {
    public readonly priority = -60;

    public readonly requires = { rotation: true };

    /**
     * @param speed
     *  - number → fixed angular velocity
     *  - object → randomized angular velocity
     */
    constructor(
        public speed:
            | number
            | {
                  min: number;
                  max: number;

                  /**
                   * Optional minimum absolute value.
                   *
                   * Example:
                   *   min=-3
                   *   max=3
                   *   minAbs=2
                   *
                   * Produces:
                   *   [-3..-2] U [2..3]
                   */
                  minAbs?: number;
              },
    ) {}

    public onSpawn(p: PxParticle) {
        const s = typeof this.speed === "number" ? this.speed : this.randomRange(this.speed.min, this.speed.max, this.speed.minAbs);

        p.angleV = s;
    }

    private randomRange(min: number, max: number, minAbs?: number): number {
        // Normal range
        if (minAbs == null || minAbs <= 0) {
            return min + Math.random() * (max - min);
        }

        // If the excluded center does not intersect range,
        // fallback to normal random
        if (min >= minAbs || max <= -minAbs) {
            return min + Math.random() * (max - min);
        }

        const leftMin = min;
        const leftMax = Math.min(-minAbs, max);

        const rightMin = Math.max(minAbs, min);
        const rightMax = max;

        const leftSize = Math.max(0, leftMax - leftMin);
        const rightSize = Math.max(0, rightMax - rightMin);

        const total = leftSize + rightSize;

        if (total <= 0) {
            return 0;
        }

        const pick = Math.random() * total;

        // Left segment
        if (pick < leftSize) {
            return leftMin + Math.random() * leftSize;
        }

        // Right segment
        return rightMin + Math.random() * rightSize;
    }
}
