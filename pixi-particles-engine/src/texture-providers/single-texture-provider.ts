import { Texture } from 'pixi.js';
import { TextureProvider } from '../texture-provider';

export class SingleTextureProvider implements TextureProvider {
    private backgroundTexture: string;

    constructor(backgroundTexture: string) {
        this.backgroundTexture = backgroundTexture;
    }

    public initialTexture() {
        return Texture.from(this.backgroundTexture);
    }
    public textureForSpawn() {
        return Texture.from(this.backgroundTexture);
    }
}
