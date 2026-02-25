import { Application, Assets } from "pixi.js";
import { MainScene } from "./main-scene";

(async () => {
    const app = new Application();
    await app.init({ resizeTo: window, backgroundColor: "#000000" });
    document.body.appendChild(app.canvas);
    await loadAssets();

    const scene = new MainScene();
    app.stage.addChild(scene);
})();

async function loadAssets(): Promise<void> {
    await Assets.load({ alias: "Sparkle", src: "/assets/Sparkle.png" });
}
