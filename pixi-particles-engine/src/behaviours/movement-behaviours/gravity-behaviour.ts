import { PxParticle } from "../../px-particle";
import { Behaviour } from "../../behaviour";
import { CurveKeyframe, CurveOptions } from "../curved-behaviour/curve-key-frame";
import { Curve } from "../curved-behaviour/curve-sampler";

export class GravityCurveBehaviour implements Behaviour {
    public readonly requires = { position: true };
    private strength: Curve;
    public gx: number;
    public gy: number;

    constructor(gx: number, gy: number, strengthKeyframes: CurveKeyframe[], opts?: CurveOptions) {
        this.gx = gx;
        this.gy = gy;
        this.strength = new Curve(strengthKeyframes, opts);
    }

    public update(p: PxParticle, dt: number) {
        const t = p.life > 0 ? p.age / p.life : 1;
        const s = this.strength.sample(t);

        p.vx += this.gx * s * dt;
        p.vy += this.gy * s * dt;
    }
}
