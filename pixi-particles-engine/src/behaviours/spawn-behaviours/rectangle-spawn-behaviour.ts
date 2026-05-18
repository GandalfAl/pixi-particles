import { PxParticle } from "../../px-particle";
import { Behaviour } from "../../behaviour";

/**
 * Spawns particles inside a rectangular border/ring centered at (0, 0).
 *
 * Outer size:
 *   width x height
 *
 * Inner empty area:
 *   innerWidth x innerHeight
 *
 * Particles spawn only in the area between the outer and inner rectangles.
 */
export class RectangleSpawnBehaviour implements Behaviour {
    public readonly priority = -100;

    constructor(
        public width: number,
        public height: number,

        // Optional inner empty rectangle
        public innerWidth: number = 0,
        public innerHeight: number = 0,
    ) {}

    public onSpawn(p: PxParticle) {
        const outerHW = this.width * 0.5;
        const outerHH = this.height * 0.5;

        const innerHW = this.innerWidth * 0.5;
        const innerHH = this.innerHeight * 0.5;

        // No inner hole -> normal rectangle spawn
        if (this.innerWidth <= 0 || this.innerHeight <= 0) {
            p.x = this.rand(-outerHW, outerHW);
            p.y = this.rand(-outerHH, outerHH);
            return;
        }

        // Pick a random point until it lands outside the inner rectangle
        while (true) {
            const x = this.rand(-outerHW, outerHW);
            const y = this.rand(-outerHH, outerHH);

            const insideInner = x > -innerHW && x < innerHW && y > -innerHH && y < innerHH;

            if (!insideInner) {
                p.x = x;
                p.y = y;
                return;
            }
        }
    }

    /** Inclusive-exclusive uniform random. */
    private rand(min: number, max: number) {
        return min + Math.random() * (max - min);
    }
}
