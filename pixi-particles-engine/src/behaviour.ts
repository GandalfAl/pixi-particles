import { ParticleProperties } from "pixi.js";
import { Emitter } from "./emitter";
import { PxParticle } from "./px-particle";

/**
 * A Behaviour is a modular unit of particle logic.
 *
 * Behaviours can:
 * - Initialize particle state at spawn (velocity, alpha, scale, etc)
 * - Update particle state each frame (curves, gravity, drag, color fade, etc)
 * - Clean up any per-particle state when the particle is recycled
 *
 * Lifecycle:
 * - init(emitter) is called once when the behaviour is added to an emitter
 * - onSpawn(p, emitter) is called each time a particle is spawned
 * - update(p, dt, emitter) is called every frame for each active particle
 * - onKill(p, emitter) is called when a particle dies and returns to the pool
 */
export interface Behaviour {
    /**
     * Execution order relative to other behaviours.
     *
     * Lower priority runs earlier.
     * When priorities are equal, execution order is stable and follows registration order.
     *
     * Use priority to ensure correct ordering when behaviours depend on each other
     * (e.g. apply movement first, then apply alpha/scale curves).
     */
    readonly priority?: number;

    /**
     * Dynamic property requirements for this behaviour.
     *
     * PixiJS ParticleContainer uses `dynamicProperties` to decide which attributes
     * must be re-uploaded to the GPU each frame.
     *
     * If your behaviour changes a property over time that affects rendering,
     * declare it here so the emitter enables the correct dynamicProperties.
     *
     * Examples:
     * - Changing `alpha` over time → requires: { color: true }
     * - Changing `scaleX/scaleY` over time → may require: { vertex: true } (depends on Pixi internals)
     * - Changing `rotation` over time → requires: { rotation: true }
     *
     * NOTE:
     * If your behaviour only sets values ON SPAWN and never changes them after,
     * you usually do NOT need to require dynamic properties.
     */
    readonly requires?: ParticleProperties;

    /**
     * Optional: called once when the behaviour is registered on an emitter.
     * Useful for caching references, precomputing curves, or validating options.
     */
    init?(emitter: Emitter): void;

    /**
     * Optional: called when a particle is spawned (taken from pool and activated).
     * Use this to initialize per-particle state for this behaviour.
     */
    onSpawn?(p: PxParticle, emitter: Emitter): void;

    /**
     * Optional: called every frame for each active particle.
     * `dt` is delta time in seconds (already clamped by the emitter).
     */
    update?(p: PxParticle, dt: number, emitter: Emitter): void;

    /**
     * Optional: called when the particle is killed and returned to the pool.
     * Use this to clear any per-particle state allocated by the behaviour.
     */
    onKill?(p: PxParticle, emitter: Emitter): void;
}
