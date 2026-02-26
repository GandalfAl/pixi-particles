import { Container } from "pixi.js";
import { Scene } from "./scene";
import {
    AlphaBehaviour,
    Emitter,
    RadialBurstBehaviour,
    ScaleCurveBehaviour,
    SingleTextureProvider,
    StaticRotationBehaviour,
} from "pixi-particles-engine";

export class MainScene extends Container implements Scene {
    constructor() {
        super({ label: "MainScene" });

        const emitter = new Emitter(
            {
                lifetime: { min: 1, max: 2 },
                mode: "wave",
                ratePerSecond: 0.1,
                maxParticles: 400,
                waveInterval: 0.05,
                particlesPerWave: 4,
                containerOptions: { label: "ExampleEmitter", blendMode: "screen", x: 400, y: 300 },
                emitting: true,
                behaviours: [
                    new RadialBurstBehaviour(200, 250),
                    new AlphaBehaviour(1, 0),
                    new StaticRotationBehaviour({ min: -4, max: 4 }),
                    new ScaleCurveBehaviour([
                        { time: 0, value: 0.4 },
                        { time: 0.1, value: 1.1 },
                        { time: 0.5, value: 0 },
                        { time: 0.8, value: 1 },
                        { time: 0.82, value: 1.2 },
                    ]),
                ],
                addAtBack: true,
            },
            new SingleTextureProvider("Sparkle"),
        );
        this.addChild(emitter);
    }
    open(): void {}
}
