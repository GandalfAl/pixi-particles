import { PxParticle } from "../../px-particle";
import { Behaviour } from "../../behaviour";

export class CircleSpawnBehaviour implements Behaviour {
    public readonly priority: number = 0;

    constructor(private readonly radius: number) {}

    public onSpawn(p: PxParticle) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * this.radius;

        p.x = Math.cos(angle) * r;
        p.y = Math.sin(angle) * r;
    }
}
