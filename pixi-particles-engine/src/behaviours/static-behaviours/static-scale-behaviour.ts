import { Behaviour } from "../../behaviour";
import { PxParticle } from "../../px-particle";

export class StaticScaleBehaviour implements Behaviour {
    public spawnScale: number;

    constructor(spawnScale: number) {
        this.spawnScale = spawnScale;
    }

    public onSpawn(p: PxParticle) {
        p.scaleX = this.spawnScale;
        p.scaleY = this.spawnScale;
    }
}
