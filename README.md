# pixi-particles

A **high-performance PixiJS v8 particle engine** built with TypeScript.

The core engine is published on npm as:

👉 **pixi-particles-engine**\
https://www.npmjs.com/package/pixi-particles-engine

This repository contains:

- `pixi-particles-engine` → The reusable particle engine package
  (published on npm)
- `pixi-sandbox` → A Webpack dev playground for live development and
  testing

---

# 📦 Install From npm

If you only want to use the engine in your project:

```bash
npm install pixi-particles-engine
```

```ts
import { Emitter } from "pixi-particles-engine";
```

---

# ✨ pixi-particles-engine

A modular, extensible particle emitter built on top of PixiJS
`ParticleContainer`, designed for real-time games and interactive
graphics.

## 🚀 Features

- Object pooling (zero runtime allocations)
- Emission modes: `rate`, `wave`, `manual`
- Priority-based behaviour system
- Texture providers (single, weighted, animated)
- Delta time clamping for stability
- Designed for performance and scalability

---

## 🔥 Basic Usage

```ts
import { Emitter, AlphaBehaviour, RadialBurstBehaviour } from "pixi-particles-engine";

const emitter = new Emitter(
    {
        maxParticles: 400,
        mode: "wave",
        waveInterval: 0.05,
        particlesPerWave: 4,
        lifetime: { min: 1, max: 2 },
        emitting: true,
        behaviours: [new RadialBurstBehaviour(200, 250), new AlphaBehaviour(1, 0)],
    },
    textureProvider,
);

app.stage.addChild(emitter);
```

---

# 🎛 Emission Modes

## Rate Mode

```ts
mode: "rate",
ratePerSecond: 50
```

## Wave Mode

```ts
mode: "wave",
waveInterval: 0.1,
particlesPerWave: 8
```

## Manual Mode

```ts
mode: "manual";
```

```ts
emitter.emitBurst(20);
emitter.emitWave();
```

---

# 🎨 Built-in Behaviours

## Alpha

- `AlphaBehaviour(start, end)`
- `AlphaCurveBehaviour(keyframes)`

## Scale

- `StaticScaleBehaviour(value)`
- `ScaleCurveBehaviour(keyframes)`

## Movement

- `RadialBurstBehaviour(minSpeed, maxSpeed)`
- `MovementCurveBehaviour(vxCurve, vyCurve)`
- `GravityCurveBehaviour(gx, gy, strengthCurve)`

## Spawn

- `RectangleSpawnBehaviour(width, height)`
- `CircleSpawnBehaviour(radius)`

---

# 🖼 Texture Providers

- `SingleTextureProvider`
- `WeightedTextureProvider`
- `AnimatedTextureProvider`

---

# 🧪 Monorepo Development Setup

This repository uses **npm workspaces**.

### Clone & Install

```bash
git clone https://github.com/GandalfAl/pixi-particles
cd pixi-particles
npm install
```

### Run Development Mode

From the root directory:

```bash
npm run dev
```

This will:

- Watch and rebuild the engine (`tsc -w`)
- Start the sandbox (`webpack serve` on port 3000)

Open:

http://localhost:3000

---

# 🏗 Project Structure

    pixi-particles/
    ├── pixi-particles-engine/
    │   ├── src/
    │   ├── package.json
    │   └── tsconfig.json
    │
    ├── pixi-sandbox/
    │   ├── src/
    │   ├── public/
    │   ├── webpack.config.js
    │   └── package.json
    │
    └── package.json (workspace root)

---

# ⚠️ Notes

- The engine is published on npm as `pixi-particles-engine`.
- The `pixi-sandbox` project consumes it via workspace for local
  development.
- Outside this monorepo, install it directly from npm.

---

# 📜 License

MIT

---

# 👑 Author

GandalfAl\
Aljaz Stucin
