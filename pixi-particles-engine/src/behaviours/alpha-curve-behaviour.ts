import { Behaviour } from "../behaviour";
import { PxParticle } from "../px-particle";
import { CurveKeyframe, CurveOptions } from "./curved-behaviour/curve-key-frame";
import { Curve } from "./curved-behaviour/curve-sampler";
import { Emitter } from "../emitter";

/**
 * Alpha over lifetime driven by a curve.
 *
 * Keyframes are sampled using normalized lifetime t in [0..1].
 * Output is clamped to [0..1].
 */
export class AlphaCurveBehaviour implements Behaviour {
    /** Alpha changes over time, so ParticleContainer must treat color as dynamic. */
    public readonly requires = { color: true };

    public readonly priority = 50;

    private curve: Curve;

    constructor(keyframes: CurveKeyframe[], opts?: CurveOptions) {
        // Always clamp alpha to [0..1]
        this.curve = new Curve(keyframes, { ...opts, clamp: { min: 0, max: 1 } });
    }

    public onSpawn(p: PxParticle) {
        p.alpha = this.curve.sample(0);
    }

    public update(p: PxParticle, _dt?: number, _emitter?: Emitter) {
        const t = p.life > 0 ? p.age / p.life : 1;
        p.alpha = this.curve.sample(t);
    }
}
