import { Utils } from "../../utils";
import { BehaviourUtils } from "../behaviour-utils";
import { CurveKeyframe, EaseFn, CurveOptions } from "./curve-key-frame";

export class Curve {
    private keys: CurveKeyframe[];
    private defaultEase?: EaseFn;
    private clamp?: { min: number; max: number };

    constructor(keyframes: CurveKeyframe[], opts?: CurveOptions) {
        this.defaultEase = opts?.defaultEase;
        this.clamp = opts?.clamp;

        const cleaned: CurveKeyframe[] = (keyframes ?? [])
            .map((k) => ({
                time: BehaviourUtils.clamp01(k.time),
                value: k.value,
                ease: k.ease,
            }))
            .sort((a, b) => a.time - b.time);

        // fallback
        if (cleaned.length === 0) cleaned.push({ time: 0, value: 0 }, { time: 1, value: 0 });

        // ensure endpoints
        if (cleaned[0].time !== 0) cleaned.unshift({ time: 0, value: cleaned[0].value });
        if (cleaned[cleaned.length - 1].time !== 1) cleaned.push({ time: 1, value: cleaned[cleaned.length - 1].value });

        this.keys = cleaned;
    }

    public sample(t01: number): number {
        const t = BehaviourUtils.clamp01(t01);

        const i = this.findSegmentIndex(t);
        const k0 = this.keys[i];
        const k1 = this.keys[i + 1];

        const span = k1.time - k0.time;
        if (span <= 0) return this.clampValue(k1.value);

        let u = (t - k0.time) / span;
        u = BehaviourUtils.clamp01(u);

        const ease = k0.ease ?? this.defaultEase;
        if (ease) u = BehaviourUtils.clamp01(ease(u));

        const v = Utils.lerp(k0.value, k1.value, u);
        return this.clampValue(v);
    }

    private findSegmentIndex(t: number): number {
        for (let i = 0; i < this.keys.length - 2; i++) {
            if (t <= this.keys[i + 1].time) return i;
        }
        return this.keys.length - 2;
    }

    private clampValue(v: number): number {
        if (!this.clamp) return v;
        return Math.min(this.clamp.max, Math.max(this.clamp.min, v));
    }
}
