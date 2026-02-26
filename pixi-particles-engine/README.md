# pixi-particles-engine

High-performance, behaviour-driven particle emitter engine for **PixiJS
v8**.

Built with pooling, modular behaviours, curve-driven animation, and GPU
optimization in mind.

------------------------------------------------------------------------

## ✨ Features

-   ⚡ Zero-allocation particle pooling
-   🧠 Behaviour-based architecture
-   🎯 Multiple emission modes (rate, wave, manual)
-   📈 Curve-driven motion, alpha, and scale
-   🎞 Animated texture provider support
-   🧩 Modular texture providers
-   🚀 Optimized ParticleContainer dynamic properties
-   🔄 Runtime emission mode switching
-   🛠 Fully TypeScript with strong typings

------------------------------------------------------------------------

## 📦 Installation

``` bash
npm install pixi-particles-engine pixi.js
```

------------------------------------------------------------------------

## 🚀 Quick Start

``` ts
import { Application } from "pixi.js";
import {
  Emitter,
  SingleTextureProvider,
  RadialBurstBehaviour,
  AlphaBehaviour
} from "pixi-particles-engine";

const app = new Application();
document.body.appendChild(app.view);

const textureProvider = new SingleTextureProvider("particle.png");

const emitter = new Emitter(
  {
    maxParticles: 500,
    mode: "rate",
    ratePerSecond: 150,
    lifetime: { min: 1, max: 2 },
    behaviours: [
      new RadialBurstBehaviour(100, 200),
      new AlphaBehaviour(1, 0)
    ]
  },
  textureProvider
);

app.stage.addChild(emitter);
```

------------------------------------------------------------------------

## 🎛 Emission Modes

### `"rate"`

Continuously emits particles at `ratePerSecond`.

### `"wave"`

Emits bursts every `waveInterval` seconds.

### `"manual"`

No automatic emission. Trigger manually:

``` ts
emitter.emitBurst(50);
```

You can change modes at runtime:

``` ts
emitter.setMode("manual");
```

------------------------------------------------------------------------

## 🧠 Behaviour System

Behaviours are modular units that control particle logic.

They can:

-   Initialize particles at spawn
-   Modify properties every frame
-   React to particle death
-   Declare required GPU dynamic properties

### Example Behaviours

-   `CircleSpawnBehaviour`
-   `RectangleSpawnBehaviour`
-   `RadialBurstBehaviour`
-   `MovementCurveBehaviour`
-   `GravityCurveBehaviour`
-   `AlphaBehaviour`
-   `AlphaCurveBehaviour`
-   `ScaleCurveBehaviour`
-   `StaticRotationBehaviour`
-   `StaticScaleBehaviour`

Behaviours run in priority order (lower runs earlier).

------------------------------------------------------------------------

## 📈 Curve-Based Animation

Motion, alpha, and scale can be driven by keyframed curves.

Example:

``` ts
new AlphaCurveBehaviour([
  { time: 0, value: 0 },
  { time: 0.2, value: 1 },
  { time: 1, value: 0 }
]);
```

Curves support:

-   Per-segment easing
-   Default easing
-   Optional clamping
-   Automatic endpoint normalization

------------------------------------------------------------------------

## 🖼 Texture Providers

TextureProviders control particle textures.

Built-in providers:

-   `SingleTextureProvider`
-   `WeightedTextureProvider`
-   `AnimatedTextureProvider`

Animated provider supports:

-   Frame sequences
-   Custom FPS
-   Looping control
-   Flipbook animation

------------------------------------------------------------------------

## ⚙️ Performance Design

-   Particles are pre-allocated in a pool
-   Hard cap on `maxParticles`
-   O(1) removal using swap-remove
-   Delta-time clamping for stability
-   Only required GPU dynamic properties are enabled

------------------------------------------------------------------------

## 🔄 Lifecycle

-   Particles are spawned from pool
-   Updated each frame
-   Recycled when lifetime expires
-   Emitter detaches from ticker on destroy

------------------------------------------------------------------------

## 🛠 Development

Designed for bundler environments (Vite, Webpack, Rollup).

If contributing locally, use the workspace setup in the main repository.

------------------------------------------------------------------------

## 📜 License

MIT
