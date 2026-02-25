export type EaseFn = (x: number) => number;

export type CurveKeyframe = {
    /** Normalized lifetime [0..1] */
    time: number;
    /** Value at this time */
    value: number;
    /** Ease for segment from this keyframe -> next keyframe */
    ease?: EaseFn;
};

export type CurveOptions = {
    /** Used when a segment has no per-keyframe ease */
    defaultEase?: EaseFn;
    /** Clamp sampled output to [min..max] (optional) */
    clamp?: { min: number; max: number };
};
