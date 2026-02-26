import { PxParticle } from "../../px-particle";
import { Behaviour } from "../../behaviour";

/**
 * Spawns particles uniformly inside a rectangle centered at (0, 0).
 * */
export class RectangleSpawnBehaviour implements Behaviour {
    public readonly priority = -100;

    constructor(
        private readonly width: number,
        private readonly height: number,
    ) {}

    public onSpawn(p: PxParticle) {
        const hw = this.width * 0.5;
        const hh = this.height * 0.5;

        p.x = this.rand(-hw, hw);
        p.y = this.rand(-hh, hh);
    }

    /** Inclusive-exclusive uniform random. */
    private rand(min: number, max: number) {
        return min + Math.random() * (max - min);
    }
}
