export type EaseFn = (x: number) => number;

export type CurveKeyframe = {
    /** Normalized lifetime [0..1]. */
    time: number;

    /** Value at this time. */
    value: number;

    /**
     * Optional easing applied to the segment starting at this keyframe,
     * i.e. easing used for interpolation from this keyframe -> next keyframe.
     */
    ease?: EaseFn;
};

export type CurveOptions = {
    /** Default easing used when a segment has no per-keyframe ease. */
    defaultEase?: EaseFn;

    /** Optional clamp on sampled output. */
    clamp?: { min: number; max: number };
};
