import { Behaviour } from "../../behaviour";
import { PxParticle } from "../../px-particle";

/**
 * Sets particle scale at spawn time.
 *
 */
export class StaticScaleBehaviour implements Behaviour {
    public readonly priority = -60;

    public spawnScale: number;

    constructor(spawnScale: number) {
        this.spawnScale = spawnScale;
    }

    public onSpawn(p: PxParticle) {
        p.scaleX = this.spawnScale;
        p.scaleY = this.spawnScale;
    }
}
