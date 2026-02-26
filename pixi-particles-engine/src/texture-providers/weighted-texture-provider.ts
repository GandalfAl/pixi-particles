import { Texture } from "pixi.js";
import { TextureProvider } from "../texture-provider";
import { PxParticle } from "../px-particle";

type WeightedTexture = {
    /** Key/URL/alias passed to PixiJS Texture.from(). */
    textureId: string;
    weight: number;
};

/**
 * Chooses a random texture at spawn time using weighted probabilities.
 *
 * - Good for variety (different spark shapes, debris pieces, etc.)
 * - Selection happens only on spawn (not per frame)
 */
export class WeightedTextureProvider implements TextureProvider {
    private readonly fallback: Texture;
    private readonly items: { texture: Texture; weight: number }[];

    private totalWeight = 0;

    constructor(items: WeightedTexture[], fallbackTextureId: string) {
        this.fallback = Texture.from(fallbackTextureId);

        // Pre-cache textures and compute total weight (ignoring negatives)
        this.items = items.map((it) => ({
            texture: Texture.from(it.textureId),
            weight: Math.max(0, it.weight),
        }));

        for (const it of this.items) this.totalWeight += it.weight;
    }

    public initialTexture(): Texture {
        return this.fallback;
    }

    public textureForSpawn(_p: PxParticle): Texture {
        if (this.totalWeight <= 0 || this.items.length === 0) return this.fallback;

        let r = Math.random() * this.totalWeight;

        for (const it of this.items) {
            r -= it.weight;
            if (r <= 0) return it.texture;
        }

        // Floating point edge-case fallback
        return this.items[this.items.length - 1]!.texture;
    }
}
