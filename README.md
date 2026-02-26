# pixi-particles

A **PixiJS v8 particle engine** built with TypeScript, bundled in a
monorepo with a Webpack sandbox for live development.

This repository contains:

- `pixi-particles-engine` → The reusable particle engine package\
- `pixi-sandbox` → A Webpack dev playground to test and preview
  effects

---

## 🚀 Monorepo Setup

This project uses **npm workspaces**.

### Root `package.json`

```json
{
    "private": true,
    "workspaces": ["pixi-sandbox", "pixi-particles-engine"],
    "scripts": {
        "dev": "concurrently \"npm run watch -w pixi-particles-engine\" \"npm run start -w pixi-sandbox\""
    },
    "devDependencies": {
        "concurrently": "^9.2.1"
    }
}
```

---

## 📦 Installation

```bash
git clone https://github.com/GandalfAl/pixi-particles
cd pixi-particles
npm install
```

---

## 🔥 Development

Run everything from the **root directory**:

```bash
npm run dev
```

This will:

- Watch and rebuild the engine (`tsc -w`)
- Start the sandbox (`webpack serve` on port 3000)

Open your browser at:

    http://localhost:3000

---

## 🏗 Project Structure

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

# 🧠 pixi-particles-engine

A modular particle emitter built on top of PixiJS `ParticleContainer`.

## Features

- Object pooling
- Emission modes: `rate`, `wave`, `manual`
- Behaviour system (modular effects)
- Texture providers (single, weighted, animated)
- Delta clamping for frame spikes

---

## ✨ Basic Usage

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

## 🎛 Emission Modes

### Rate Mode

```ts
mode: "rate",
ratePerSecond: 50
```

### Wave Mode

```ts
mode: "wave",
waveInterval: 0.1,
particlesPerWave: 8
```

### Manual Mode

```ts
mode: "manual";
```

```ts
emitter.emitBurst(20);
emitter.emitWave();
```

---

# 🎨 Built-in Behaviours

### Alpha

- `AlphaBehaviour(start, end)`
- `AlphaCurveBehaviour(keyframes)`

### Scale

- `StaticScaleBehaviour(value)`
- `ScaleCurveBehaviour(keyframes)`

### Movement

- `RadialBurstBehaviour(minSpeed, maxSpeed)`
- `MovementCurveBehaviour(vxCurve, vyCurve)`
- `GravityCurveBehaviour(gx, gy, strengthCurve)`

### Spawn

- `RectangleSpawnBehaviour(width, height)`
- `CircleSpawnBehaviour(radius)`

---

# 🖼 Texture Providers

- `SingleTextureProvider`
- `WeightedTextureProvider`
- `AnimatedTextureProvider`

---

# 🧪 Sandbox

The sandbox:

- Creates a PixiJS Application
- Loads textures using `Assets`
- Mounts a demo scene
- Hot reloads during development

To build sandbox only:

```bash
npm run build -w pixi-sandbox
```

To build engine only:

```bash
npm run build -w pixi-particles-engine
```

---

# ⚠️ Notes

- The engine is not published to npm by default --- it's consumed via
  workspace.

---

# 📜 License

MIT

---

# 👑 Author

GandalfAl
Aljaz Stucin
