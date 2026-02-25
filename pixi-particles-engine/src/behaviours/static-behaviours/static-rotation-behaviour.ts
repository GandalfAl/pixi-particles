import { Behaviour } from "../../behaviour";
import { PxParticle } from "../../px-particle";

export class StaticRotationBehaviour implements Behaviour {
    public readonly requires = { rotation: true };

    constructor(private readonly speed: number | { min: number; max: number }) {}

    public onSpawn(p: PxParticle) {
        const s =
            typeof this.speed === "number"
                ? this.speed
                : this.speed.min + Math.random() * (this.speed.max - this.speed.min);

        p.angleV = s;
    }
}
