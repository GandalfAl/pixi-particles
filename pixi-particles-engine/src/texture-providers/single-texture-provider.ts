import { Texture } from "pixi.js";
import { TextureProvider } from "../texture-provider";

/**
 * Always returns the same texture for every particle.
 * Useful for simple effects (sparks, smoke puffs, etc).
 */
export class SingleTextureProvider implements TextureProvider {
    /** Key/URL/alias passed to PixiJS Texture.from(). */
    private readonly textureId: string;

    private readonly texture: Texture;

    constructor(textureId: string) {
        this.textureId = textureId;
        this.texture = Texture.from(textureId);
    }

    public initialTexture(): Texture {
        return this.texture;
    }
}
