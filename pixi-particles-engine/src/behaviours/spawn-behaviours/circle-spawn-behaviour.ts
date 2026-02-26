import { PxParticle } from "../../px-particle";
import { Behaviour } from "../../behaviour";

/**
 * Spawns particles uniformly within a circle centered at (0, 0).
 *
 * Uses sqrt(random) to achieve uniform distribution by area
 * (without sqrt you'd get clustering toward the center).
 *
 */
export class CircleSpawnBehaviour implements Behaviour {
    public readonly priority = -100;

    constructor(private readonly radius: number) {}

    public onSpawn(p: PxParticle) {
        const angle = Math.random() * Math.PI * 2;

        const r = Math.sqrt(Math.random()) * this.radius;

        p.x = Math.cos(angle) * r;
        p.y = Math.sin(angle) * r;
    }
}
