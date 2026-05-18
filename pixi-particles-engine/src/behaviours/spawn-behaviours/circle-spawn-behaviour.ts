import { PxParticle } from "../../px-particle";
import { Behaviour } from "../../behaviour";

/**
 * Spawns particles inside a circular ring centered at (0, 0).
 *
 * Outer radius:
 *   radius
 *
 * Inner empty radius:
 *   innerRadius
 *
 * Particles spawn only between the outer and inner circles.
 *
 * Uses sqrt(random) to maintain uniform area distribution.
 */
export class CircleSpawnBehaviour implements Behaviour {
    public readonly priority = -100;

    constructor(
        private readonly radius: number,
        private readonly innerRadius: number = 0,
    ) {}

    public onSpawn(p: PxParticle) {
        const angle = Math.random() * Math.PI * 2;

        const outerR2 = this.radius * this.radius;
        const innerR2 = this.innerRadius * this.innerRadius;

        // Uniform distribution across ring area
        const r = Math.sqrt(innerR2 + Math.random() * (outerR2 - innerR2));

        p.x = Math.cos(angle) * r;
        p.y = Math.sin(angle) * r;
    }
}
