import { Particle, ParticleOptions } from "pixi.js";

/**
 * Internal state used by AnimatedTextureProvider.
 *
 * `t` tracks elapsed time (seconds) inside the animation.
 * This allows providers to compute frame index based on lifetime progression.
 */
export type AnimatedParticleState = {
    t: number; // seconds progressed in animated texture (sprite sheet)
};

/**
 * PxParticle extends PixiJS {@link Particle} with simulation state.
 *
 * Why this exists:
 * - Pixi's Particle handles rendering efficiently.
 * - We extend it to attach simulation data (velocity, lifetime, etc).
 * - Instances are pooled and reused by the Emitter.
 *
 * IMPORTANT:
 * Particles are never destroyed during runtime.
 * They are recycled via onKill() and reused via onSpawn().
 */
export class PxParticle extends Particle {
    /** Seconds since spawn. */
    public age = 0;

    /** Total lifetime in seconds (randomized per spawn by the emitter). */
    public life = 1;

    /** Velocity in pixels per second (X axis). */
    public vx = 0;

    /** Velocity in pixels per second (Y axis). */
    public vy = 0;

    /** Angular velocity in radians per second. */
    public angleV = 0;

    /**
     * Optional provider-specific animation state.
     * Used by AnimatedTextureProvider (if present).
     */
    public animatedParticleState?: AnimatedParticleState;

    constructor(options: ParticleOptions) {
        // Center anchor by default
        options.anchorX = 0.5;
        options.anchorY = 0.5;

        super(options);

        // Start in pooled/inactive state.
        this.onKill();
    }

    /**
     * Resets the particle into pooled (inactive) state.
     *
     * Called when:
     * - The particle exceeds its lifetime
     * - The emitter clears particles
     *
     * This must leave the particle in a clean state so it can safely be reused.
     */
    public onKill(): void {
        this.age = 0;
        this.life = 1;

        this.vx = 0;
        this.vy = 0;
        this.angleV = 0;

        this.animatedParticleState = undefined;
    }

    /**
     * Prepares the particle for active simulation.
     *
     * Called when:
     * - The emitter spawns this particle from the pool
     *
     * Resets all visual and simulation state to defaults.
     * Behaviours will then modify properties as needed.
     */
    public onSpawn(): void {
        this.age = 0;
        this.life = 1;

        this.vx = 0;
        this.vy = 0;
        this.angleV = 0;

        this.animatedParticleState = undefined;

        // Reset visual state
        this.alpha = 1;
        this.tint = 0xffffff;

        this.rotation = 0;
        this.scaleX = 1;
        this.scaleY = 1;

        this.x = 0;
        this.y = 0;
    }
}
