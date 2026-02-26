import { Texture } from "pixi.js";
import { TextureProvider } from "../texture-provider";
import { PxParticle } from "../px-particle";

/**
 * Configuration for AnimatedTextureProvider.
 *
 * Frames are generated using:
 *   `${texturePrefix}${frameNumber}`
 *
 * Example:
 *   texturePrefix: "Explosion_"
 *   numberOfFrames: 16
 *   padLength: 3
 *
 * Generates:
 *   Explosion_000
 *   Explosion_001
 *   ...
 *   Explosion_015
 */
export interface AnimatedTextureProviderOptions {
    /**
     * Prefix used to construct frame aliases.
     */
    texturePrefix: string;

    /** Total number of frames in the animation sequence. */
    numberOfFrames: number;

    /** Optional starting frame index (default: 0). */
    firstFrame?: number;

    /**
     * Optional zero-padding length.
     * If omitted, defaults to numberOfFrames digit length.
     *
     * Example:
     *   numberOfFrames = 16 → default padLength = 2
     *   frame 3 → "03"
     */
    padLength?: number;

    /** Frames per second (default: 60). */
    fps?: number;

    /**
     * If true, animation loops.
     * If false, animation stops at the last frame.
     * Default: true.
     */
    loop?: boolean;
}

/**
 * Flipbook-style animated texture provider.
 *
 * Each particle cycles through a pre-generated array of textures
 * based on elapsed time and configured FPS.
 *
 * This is NOT a Pixi AnimatedSprite.
 * Instead, it swaps particle.texture manually each frame.
 *
 * Because UVs change when textures change, this provider declares:
 *   requires = { uvs: true }
 *
 * so the Emitter enables the correct ParticleContainer dynamicProperties.
 */
export class AnimatedTextureProvider implements TextureProvider {
    /** UV updates are required because textures change during lifetime. */
    public readonly requires = { uvs: true };

    /** Preloaded frame textures. */
    private readonly frames: Texture[];

    /** Frames per second for animation playback. */
    private readonly fps: number;

    /** Whether animation loops. */
    private readonly loop: boolean;

    constructor(options: AnimatedTextureProviderOptions) {
        const start = options.firstFrame ?? 0;

        const padLength = options.padLength ?? options.numberOfFrames.toString().length;

        this.frames = [];

        for (let i = start; i < options.numberOfFrames + start; i++) {
            const alias = `${options.texturePrefix}${i.toString().padStart(padLength, "0")}`;
            this.frames.push(Texture.from(alias));
        }

        if (this.frames.length === 0) {
            throw new Error("AnimatedTextureProvider: no frames generated");
        }

        this.fps = options.fps ?? 60;
        this.loop = options.loop ?? true;
    }

    /**
     * Used when constructing pooled particles.
     * Returns the first frame as a placeholder texture.
     */
    public initialTexture(): Texture {
        return this.frames[0];
    }

    /**
     * Called each time a particle is spawned.
     *
     * Initializes per-particle animation state
     * and resets animation to first frame.
     */
    public textureForSpawn(p: PxParticle): Texture {
        p.animatedParticleState = { t: 0 };
        return this.frames[0];
    }

    /**
     * Per-frame update hook.
     *
     * Advances animation time and selects the appropriate frame.
     */
    public update(p: PxParticle, dt: number): void {
        if (!p.animatedParticleState || this.frames.length <= 1) return;

        p.animatedParticleState.t += dt;

        const time = p.animatedParticleState.t;
        const rawFrame = Math.floor(time * this.fps);

        const idx = this.loop ? rawFrame % this.frames.length : Math.min(rawFrame, this.frames.length - 1);

        p.texture = this.frames[idx];
    }

    /**
     * Called when particle is recycled.
     * Clears animation state to avoid stale data in pooled particles.
     */
    public onKill(p: PxParticle): void {
        p.animatedParticleState = undefined;
    }
}
