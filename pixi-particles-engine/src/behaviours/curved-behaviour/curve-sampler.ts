import { Utils } from "../../utils";
import { CurveKeyframe, EaseFn, CurveOptions } from "./curve-key-frame";

/**
 * Lightweight curve sampler for keyframed 1D values over normalized time [0..1].
 *
 * - Keyframes are clamped to [0..1] and sorted by time.
 * - Endpoints at t=0 and t=1 are ensured (added if missing).
 * - Each segment can have its own easing function.
 */
export class Curve {
    /** Cleaned + sorted keyframes (always includes endpoints at 0 and 1). */
    private keys: CurveKeyframe[];

    /** Default easing used when the keyframe has no `ease`. */
    private defaultEase?: EaseFn;

    /** Optional output clamp. */
    private clamp?: { min: number; max: number };

    constructor(keyframes: CurveKeyframe[], opts?: CurveOptions) {
        this.defaultEase = opts?.defaultEase;
        this.clamp = opts?.clamp;

        // Normalize and sort keyframes.
        const cleaned: CurveKeyframe[] = (keyframes ?? [])
            .map((k) => ({
                time: Utils.clamp01(k.time),
                value: k.value,
                ease: k.ease,
            }))
            .sort((a, b) => a.time - b.time);

        // Fallback: flat zero curve.
        if (cleaned.length === 0) cleaned.push({ time: 0, value: 0 }, { time: 1, value: 0 });

        // Ensure endpoints exist at t=0 and t=1.
        if (cleaned[0].time !== 0) cleaned.unshift({ time: 0, value: cleaned[0].value });

        if (cleaned[cleaned.length - 1].time !== 1)
            cleaned.push({
                time: 1,
                value: cleaned[cleaned.length - 1].value,
            });

        this.keys = cleaned;
    }

    /**
     * Samples the curve at normalized time t01.
     * Input is clamped to [0..1].
     */
    public sample(t01: number): number {
        const t = Utils.clamp01(t01);

        // Find which segment [k0..k1] contains t.
        const i = this.findSegmentIndex(t);
        const k0 = this.keys[i];
        const k1 = this.keys[i + 1];

        const span = k1.time - k0.time;
        if (span <= 0) return this.clampValue(k1.value);

        // Normalize t into segment space [0..1].
        let u = (t - k0.time) / span;
        u = Utils.clamp01(u);

        // Apply easing for this segment (if any).
        const ease = k0.ease ?? this.defaultEase;
        if (ease) u = Utils.clamp01(ease(u));

        // Linear interpolation between segment endpoints.
        const v = Utils.lerp(k0.value, k1.value, u);
        return this.clampValue(v);
    }

    /**
     * Finds the segment index i such that t is between keys[i] and keys[i+1].
     */
    private findSegmentIndex(t: number): number {
        for (let i = 0; i < this.keys.length - 2; i++) {
            if (t <= this.keys[i + 1].time) return i;
        }
        return this.keys.length - 2;
    }

    /** Applies optional output clamp. */
    private clampValue(v: number): number {
        if (!this.clamp) return v;
        return Math.min(this.clamp.max, Math.max(this.clamp.min, v));
    }
}
