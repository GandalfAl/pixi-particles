import { ParticleProperties, Texture } from "pixi.js";
import { PxParticle } from "./px-particle";

export interface TextureProvider {
    readonly requires?: ParticleProperties;

    /** Called once when the particle is created for the pool (must return a texture). */
    initialTexture(): Texture;

    /** Called on every spawn (must return a texture, can depend on particle). */
    textureForSpawn(p: PxParticle): Texture;

    /** Optional: per-frame update for animated sprites */
    update?(p: PxParticle, dt: number): void;

    /** Optional: reset */
    onKill?(p: PxParticle): void;
}
