import { PxParticle } from "../px-particle";
import { Behaviour } from "../behaviour";
import { Emitter } from "../emitter";

/**
 * Linearly fades alpha from startAlpha -> endAlpha over particle lifetime.
 */
export class AlphaBehaviour implements Behaviour {
    public readonly requires = { color: true };

    public readonly priority = 50;

    public startAlpha = 1;
    public endAlpha = 0;

    constructor(startAlpha = 1, endAlpha = 0) {
        this.startAlpha = startAlpha;
        this.endAlpha = endAlpha;
    }

    public onSpawn(p: PxParticle, _emitter: Emitter): void {
        p.alpha = this.startAlpha;
    }

    public update(p: PxParticle, _dt: number, _emitter: Emitter): void {
        const t = p.life > 0 ? Math.min(1, Math.max(0, p.age / p.life)) : 1;
        p.alpha = this.startAlpha + (this.endAlpha - this.startAlpha) * t;
    }
}
