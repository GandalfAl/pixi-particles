export class BehaviourUtils {
    // Clamp 0 to 1
    public static clamp01(v: number) {
        return v < 0 ? 0 : v > 1 ? 1 : v;
    }

    public static rand(min: number, max: number) {
        return min + Math.random() * (max - min);
    }
}
