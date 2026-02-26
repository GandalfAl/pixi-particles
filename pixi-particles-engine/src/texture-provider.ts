import { ParticleProperties, Texture } from "pixi.js";
import { PxParticle } from "./px-particle";

/**
 * TextureProvider decides which {@link Texture} a particle uses.
 *
 * It is called in two different phases:
 * 1) Pool creation: `initialTexture()` (required by Pixi to construct the particle)
 * 2) Spawn / simulation: `textureForSpawn()` and optional `update()`
 *
 * Providers may be stateless (single texture) or stateful (animated textures, weighted random, etc).
 * Keep provider methods lightweight: they can be called very frequently.
 */
export interface TextureProvider {
    /**
     * Dynamic property requirements for this provider.
     *
     * PixiJS ParticleContainer can skip updating GPU buffers unless you mark certain fields as dynamic.
     * If your provider changes something over time that affects rendering (e.g. UVs for animation),
     * declare it here so the emitter enables the correct `dynamicProperties`.
     *
     * Example:
     *   requires: { uvs: true }
     */
    readonly requires?: ParticleProperties;

    /**
     * Called once per pooled particle, at pool initialization time.
     *
     * Pixi requires a texture to construct each Particle, so this must always return a valid Texture.
     * The texture returned here is just an initial placeholder; it can be replaced on spawn.
     */
    initialTexture(): Texture;

    /**
     * Called every time a particle is spawned.
     *
     * Must return a valid texture. May depend on:
     * - random selection (weighted sets)
     * - emitter state
     * - particle state (reused pooled particle)
     *
     */
    textureForSpawn?(p: PxParticle): Texture;

    /**
     * Optional per-frame hook.
     *
     * Use this when the texture can change during the particle's life:
     * - animated textures (flipbook)
     * - texture swapping
     *
     * If you mutate anything that affects rendering (like UVs), ensure `requires`
     * contains the correct dynamicProperties.
     */
    update?(p: PxParticle, dt: number): void;

    /**
     * Optional recycle hook.
     *
     * Called when a particle is killed and returned to the pool.
     * Use this to clear any provider-specific state stored on the particle
     * (e.g. animation frame index, timers, cached references).
     */
    onKill?(p: PxParticle): void;
}
