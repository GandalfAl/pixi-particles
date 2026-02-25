import { PxParticle } from "../px-particle";
import { Behaviour } from "../behaviour";
import { CurveKeyframe, CurveOptions } from "./curved-behaviour/curve-key-frame";
import { Curve } from "./curved-behaviour/curve-sampler";

export class ScaleCurveBehaviour implements Behaviour {
    public readonly requires = { vertex: true };

    private curve: Curve;

    constructor(keyframes: CurveKeyframe[], opts?: CurveOptions) {
        this.curve = new Curve(keyframes, { ...opts, clamp: { min: 0, max: Number.POSITIVE_INFINITY } });
    }

    public onSpawn(p: PxParticle) {
        const s = this.curve.sample(0);
        p.scaleX = s;
        p.scaleY = s;
    }

    public apply(p: PxParticle) {
        const t = p.life > 0 ? p.age / p.life : 1;
        const s = this.curve.sample(t);
        p.scaleX = s;
        p.scaleY = s;
    }
}
