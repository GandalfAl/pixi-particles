export class Utils {
    public static lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    public static clamp01(v: number) {
        return v < 0 ? 0 : v > 1 ? 1 : v;
    }

    public static rand(min: number, max: number) {
        return min + Math.random() * (max - min);
    }
}
