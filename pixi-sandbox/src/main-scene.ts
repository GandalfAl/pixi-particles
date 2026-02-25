import { Assets, Container, Graphics, Sprite, Texture } from "pixi.js";
import { Scene } from "./scene";
import { Emitter, SingleTextureProvider } from "pixi-particles-engine";

export class MainScene extends Container implements Scene {
    constructor() {
        super({ label: "MainScene" });

        const graphicsTest = new Graphics();
        graphicsTest.rect(0, 0, 100, 100).fill("red");
        this.addChild(graphicsTest);

        const emitter = new Emitter(
            {
                lifetime: { min: 1, max: 2 },
                mode: "rate",
                ratePerSecond: 1,
                maxParticles: 1,
                containerOptions: { x: 400, y: 300 },
                emitting: true,
            },
            new SingleTextureProvider("Sparkle"),
        );
        this.addChild(emitter);
    }
    open(): void {}
}
