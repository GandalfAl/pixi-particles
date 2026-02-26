import { PxParticle } from "../../px-particle";
import { Behaviour } from "../../behaviour";
import { CurveKeyframe, CurveOptions } from "../curved-behaviour/curve-key-frame";
import { Curve } from "../curved-behaviour/curve-sampler";

export class MovementCurveBehaviour implements Behaviour {
    public readonly requires = { position: true };
    public readonly priority: number = 10;

    private vxCurve: Curve;
    private vyCurve: Curve;

    constructor(vxKeyframes: CurveKeyframe[], vyKeyframes: CurveKeyframe[], opts?: CurveOptions) {
        this.vxCurve = new Curve(vxKeyframes, opts);
        this.vyCurve = new Curve(vyKeyframes, opts);
    }

    public update(p: PxParticle, dt: number) {
        const t = p.life > 0 ? p.age / p.life : 1;

        p.vx = this.vxCurve.sample(t);
        p.vy = this.vyCurve.sample(t);
    }
}
