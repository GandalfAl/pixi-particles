import { PxParticle } from "../px-particle";
import { Behaviour } from "../behaviour";
import { Emitter } from "../emitter";

export class AlphaBehaviour implements Behaviour {
    public readonly requires = { color: true };

    constructor(
        private readonly startAlpha = 1,
        private readonly endAlpha = 0,
    ) {}

    public onSpawn(p: PxParticle, _emitter: Emitter): void {
        p.alpha = this.startAlpha;
    }

    public apply(p: PxParticle, _dt: number, _emitter: Emitter): void {
        const t = p.life > 0 ? Math.min(1, Math.max(0, p.age / p.life)) : 1;
        p.alpha = this.startAlpha + (this.endAlpha - this.startAlpha) * t;
    }
}
