import { Behaviour } from "../behaviour";
import { PxParticle } from "../px-particle";
import { CurveKeyframe, CurveOptions } from "./curved-behaviour/curve-key-frame";
import { Curve } from "./curved-behaviour/curve-sampler";
import { Emitter } from "../emitter";

/**
 * Rotation over lifetime driven by a curve.
 *
 * Keyframes are sampled using normalized lifetime t in [0..1].
 * Output is clamped to [0..1].
 */
export class RotationCurveBehaviour implements Behaviour {
    public readonly requires = { color: true };

    public readonly priority = 50;

    private curve: Curve;

    constructor(keyframes: CurveKeyframe[], opts?: CurveOptions) {
        this.curve = new Curve(keyframes);
    }

    public onSpawn(p: PxParticle) {
        p.angleVScale = this.curve.sample(0);
    }

    public update(p: PxParticle, _dt?: number, _emitter?: Emitter) {
        const t = p.life > 0 ? p.age / p.life : 1;
        p.angleVScale = this.curve.sample(t);
    }
}
