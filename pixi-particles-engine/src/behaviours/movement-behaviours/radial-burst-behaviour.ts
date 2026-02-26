import { PxParticle } from "../../px-particle";
import { Behaviour } from "../../behaviour";
import { Utils } from "../../utils";
import { ParticleProperties } from "pixi.js";

/**
 * Initializes particle velocity on spawn in a radial/cone burst.
 *
 * - Picks a random angle within [direction - spread/2, direction + spread/2]
 * - Picks a random speed within [minSpeed, maxSpeed]
 * - Sets particle velocity (vx, vy) in pixels/sec
 *
 * Notes:
 * - This behaviour does NOT move particles directly; the emitter integrates vx/vy each tick.
 */
export class RadialBurstBehaviour implements Behaviour {
    public readonly priority = -80;

    public requires: ParticleProperties = { position: true };

    /** Minimum initial speed (px/sec). */
    public minSpeed: number;

    /** Maximum initial speed (px/sec). */
    public maxSpeed: number;

    /**
     * Center direction in radians.
     * Pixi coordinate system:
     * - 0 = right
     * - PI/2 = down
     */
    public direction: number = 0;

    /**
     * Cone spread in radians.
     * - 2π = full circle
     * - PI/3 ≈ 60° cone
     */
    public spread: number = Math.PI * 2;

    constructor(minSpeed: number, maxSpeed: number, direction: number = 0, spread: number = Math.PI * 2) {
        this.minSpeed = minSpeed;
        this.maxSpeed = maxSpeed;
        this.direction = direction;
        this.spread = spread;
    }

    public onSpawn(p: PxParticle) {
        const half = this.spread * 0.5;
        const angle = this.direction + Utils.rand(-half, half);
        const speed = Utils.rand(this.minSpeed, this.maxSpeed);

        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
    }
}
