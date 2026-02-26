import { Behaviour } from "../../behaviour";
import { PxParticle } from "../../px-particle";

/**
 * Sets a particle's angular velocity at spawn time.
 *
 * Does NOT modify rotation per frame directly.
 * Instead, it initializes `angleV`, which the emitter integrates each tick.
 *
 */
export class StaticRotationBehaviour implements Behaviour {
    public readonly priority = -60;

    public readonly requires = { rotation: true };

    /**
     * @param speed
     *  - number → fixed angular velocity (radians/sec)
     *  - {min,max} → randomized angular velocity per particle
     */
    constructor(public speed: number | { min: number; max: number }) {}

    public onSpawn(p: PxParticle) {
        const s = typeof this.speed === "number" ? this.speed : this.speed.min + Math.random() * (this.speed.max - this.speed.min);

        p.angleV = s;
    }
}
