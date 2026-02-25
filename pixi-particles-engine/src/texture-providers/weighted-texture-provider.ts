import { ParticleProperties, Texture } from 'pixi.js';
import { TextureProvider } from '../texture-provider';

type WeightedTexture = { backgroundTexture: string; weight: number };

export class WeightedTextureProvider implements TextureProvider {
    public requires: ParticleProperties = { uvs: true }; // Because on spawn we change texture
    private total = 0;

    constructor(
        private items: WeightedTexture[],
        private fallbackTexture: string,
    ) {
        for (const it of items) this.total += Math.max(0, it.weight);
    }

    public initialTexture() {
        return Texture.from(this.fallbackTexture);
    }

    public textureForSpawn() {
        if (this.total <= 0) return Texture.from(this.fallbackTexture);
        let r = Math.random() * this.total;

        for (const it of this.items) {
            r -= Math.max(0, it.weight);
            if (r <= 0) return Texture.from(it.backgroundTexture);
        }
        return Texture.from(this.items[this.items.length - 1]?.backgroundTexture ?? this.fallbackTexture);
    }
}
