import { Texture } from "pixi.js";
import { TextureProvider } from "../texture-provider";
import { PxParticle } from "../px-particle";

export interface AnimatedTextureProviderOptions {
    texturePrefix: string;
    numberOfFrames: number;
    firstFrame?: number;
    padLength?: number;
    fps?: number;
    loop?: boolean;
}

export class AnimatedTextureProvider implements TextureProvider {
    public readonly requires = { uvs: true };
    private readonly frames: Texture[];
    private readonly fps: number;
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

    public initialTexture(): Texture {
        return this.frames[0];
    }

    public textureForSpawn(p: PxParticle): Texture {
        p.animatedParticleState = { t: 0 };
        return this.frames[0];
    }

    public update(p: PxParticle, dt: number): void {
        if (!p.animatedParticleState || this.frames.length <= 1) return;

        p.animatedParticleState.t += dt;

        const time = p.animatedParticleState.t;
        const rawFrame = Math.floor(time * this.fps);

        const idx = this.loop ? rawFrame % this.frames.length : Math.min(rawFrame, this.frames.length - 1);

        p.texture = this.frames[idx];
    }

    public onKill(p: PxParticle): void {
        p.animatedParticleState = undefined;
    }
}
