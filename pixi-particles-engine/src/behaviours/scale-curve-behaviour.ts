import { PxParticle } from "../px-particle";
import { Behaviour } from "../behaviour";
import { CurveKeyframe, CurveOptions } from "./curved-behaviour/curve-key-frame";
import { Curve } from "./curved-behaviour/curve-sampler";
import { Emitter } from "../emitter";

/**
 * Uniform scale over lifetime driven by a curve.
 *
 * Samples a curve using normalized lifetime t in [0..1] and applies:
 *   scaleX = scaleY = curve(t)
 */
export class ScaleCurveBehaviour implements Behaviour {
    public readonly requires = { vertex: true };

    public readonly priority = 50;

    private curve: Curve;

    constructor(keyframes: CurveKeyframe[], opts?: CurveOptions) {
        this.curve = new Curve(keyframes, { ...opts });
    }

    public onSpawn(p: PxParticle) {
        const s = this.curve.sample(0);
        p.scaleX = s;
        p.scaleY = s;
    }

    public update(p: PxParticle, _dt?: number, _emitter?: Emitter) {
        const t = p.life > 0 ? p.age / p.life : 1;
        const s = this.curve.sample(t);
        p.scaleX = s;
        p.scaleY = s;
    }
}
