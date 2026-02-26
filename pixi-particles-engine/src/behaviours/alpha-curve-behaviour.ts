import { Behaviour } from "../behaviour";
import { PxParticle } from "../px-particle";
import { CurveKeyframe, CurveOptions } from "./curved-behaviour/curve-key-frame";
import { Curve } from "./curved-behaviour/curve-sampler";

export class AlphaCurveBehaviour implements Behaviour {
    public readonly requires = { color: true };

    private curve: Curve;

    constructor(keyframes: CurveKeyframe[], opts?: CurveOptions) {
        this.curve = new Curve(keyframes, { ...opts, clamp: { min: 0, max: 1 } });
    }

    public onSpawn(p: PxParticle) {
        p.alpha = this.curve.sample(0);
    }

    public update(p: PxParticle) {
        const t = p.life > 0 ? p.age / p.life : 1;
        p.alpha = this.curve.sample(t);
    }
}
