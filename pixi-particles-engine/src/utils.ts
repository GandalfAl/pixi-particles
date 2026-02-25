export class Utils {
    public static lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }
}
