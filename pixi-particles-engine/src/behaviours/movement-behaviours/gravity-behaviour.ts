import { PxParticle } from "../../px-particle";
import { Behaviour } from "../../behaviour";
import { CurveKeyframe, CurveOptions } from "../curved-behaviour/curve-key-frame";
import { Curve } from "../curved-behaviour/curve-sampler";

/**
 * Applies an acceleration (gx, gy) scaled by a curve over lifetime.
 *
 * This modifies velocity every frame:
 *   v += g * strength(t) * dt
 *
 * where t is normalized particle age in [0..1].
 *
 * Typical uses:
 * - Gravity that ramps up/down over lifetime
 * - Wind that fades in/out
 * - Custom "pull" forces controlled by a curve
 *
 */
export class GravityCurveBehaviour implements Behaviour {
    public readonly requires = { position: true };
    public readonly priority = 0;

    /** Acceleration vector (units: px/s² when strength is 1). */
    public gx: number;
    public gy: number;

    /** Strength curve sampled by normalized lifetime. */
    private strength: Curve;

    constructor(gx: number, gy: number, strengthKeyframes: CurveKeyframe[], opts?: CurveOptions) {
        this.gx = gx;
        this.gy = gy;
        this.strength = new Curve(strengthKeyframes, opts);
    }

    /**
     * Called every frame for each particle.
     * dt is in seconds.
     */
    public update(p: PxParticle, dt: number) {
        const t = p.life > 0 ? p.age / p.life : 1;
        const s = this.strength.sample(t);

        p.vx += this.gx * s * dt;
        p.vy += this.gy * s * dt;
    }
}
