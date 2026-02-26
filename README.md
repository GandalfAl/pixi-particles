# pixi-particles

A small **monorepo** for a **PixiJS v8** particle engine + a Webpack sandbox to preview effects.

- **`pixi-particles-engine`**: the reusable engine package (TypeScript, pooling, behaviours)
- **`pixi-sandbox`**: a dev playground that imports the engine and renders examples

> The root repo is set up as **npm workspaces** and the main workflow is running **one dev command** at the root. :contentReference[oaicite:0]{index=0}

---

## Repo layout

.
├─ pixi-particles-engine/ # the engine package (exports API from src/)
└─ pixi-sandbox/ # webpack dev sandbox

---

## Requirements

- Node.js + npm (workspaces enabled)
- A modern browser (for the sandbox)

---

## Install

```bash
git clone https://github.com/GandalfAl/pixi-particles
cd pixi-particles
npm install
Development (the only “normal” command)

From the repo root:

npm run dev

This runs two processes concurrently:

tsc -w in pixi-particles-engine (watch + rebuild engine)

webpack serve in pixi-sandbox (live reload playground)

The sandbox dev server is configured to run on port 3000.

Build
Build the sandbox
npm run build -w pixi-sandbox

(pixi-sandbox has build: webpack)

Build the engine
npm run build -w pixi-particles-engine

(pixi-particles-engine uses tsc)
```

What’s inside
pixi-particles-engine

The engine is a ParticleContainer-based emitter with:

Pooling: particles are pre-created and reused

Emission modes: "rate", "wave", "manual"

Behaviours: composable modules that set/update particle properties

Texture providers: choose a texture per spawn, including animated textures

Package metadata / peer dependency: PixiJS ^8.

Exports are defined so that bundlers can use src/ during development via the "development" condition (useful for debugging the engine while working in the sandbox).

pixi-sandbox

A Webpack + TypeScript playground that creates a PixiJS Application, loads assets, and mounts a sample scene.

Quick start: using the engine

This is essentially what the sandbox is doing (simplified). The sandbox example creates an Emitter with a few behaviours and a texture provider.

```bash
import { Container } from "pixi.js";
import {
  Emitter,
  AlphaBehaviour,
  RadialBurstBehaviour,
  ScaleCurveBehaviour,
  StaticRotationBehaviour,
  SingleTextureProvider,
} from "pixi-particles-engine";

export class Example extends Container {
  constructor() {
    super();

    const emitter = new Emitter(
      {
        maxParticles: 400,
        mode: "wave",
        waveInterval: 0.05,
        particlesPerWave: 4,
        lifetime: { min: 1, max: 2 },
        emitting: true,
        containerOptions: {
          // ParticleContainer options
          x: 400,
          y: 300,
          blendMode: "screen",
        },
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
      new SingleTextureProvider("Sparkle")
    );

    this.addChild(emitter);
  }
}
```

In the sandbox, the "Sparkle" texture alias is loaded via Assets.load({ alias: "Sparkle", src: "/assets/Sparkle.png" }).

Engine API overview
Emitter

Emitter extends ParticleContainer and owns:

a pool of PxParticle

an active list

a list of sorted behaviours (by priority, stable by registration order)

an optional Ticker hook (auto-updating for non-manual modes)

Emission modes

"rate": spawn ratePerSecond continuously

"wave": spawn particlesPerWave every waveInterval seconds

"manual": you call:

emitBurst(count)

emitWave()

Core options (EmitterOptions)

Key fields (see source for full list):

maxParticles: number

mode: "rate" | "wave" | "manual"

lifetime: { min: number; max: number }

behaviours?: Behaviour[]

containerOptions?: ParticleContainerOptions

ticker?: Ticker (optional custom ticker)

maxDeltaSeconds?: number (clamps big dt spikes)

emitting?: boolean

addAtBack?: boolean

PxParticle

Custom particle type extending Pixi’s Particle with extra state:

age, life

velocity: vx, vy

angular velocity: angleV

optional animatedParticleState used by animated textures

Built-in behaviours

Behaviours implement this interface:

optional init(emitter)

onSpawn(p, emitter)

apply(p, dt, emitter)

onKill(p, emitter)

requires tells the emitter which ParticleContainer dynamic properties must be enabled for rendering updates

Included behaviours (current repo):

Alpha

AlphaBehaviour(startAlpha, endAlpha) linear over lifetime

AlphaCurveBehaviour(keyframes, opts?) samples a curve over lifetime

Scale

StaticScaleBehaviour(spawnScale)

ScaleCurveBehaviour(keyframes, opts?)

Rotation

StaticRotationBehaviour(speed | {min,max}) sets angleV on spawn

Movement

RadialBurstBehaviour(minSpeed, maxSpeed, direction?, spread?) sets velocity on spawn

MovementCurveBehaviour(vxKeyframes, vyKeyframes, opts?) sets velocity continuously from curves

GravityCurveBehaviour(gx, gy, strengthKeyframes, opts?) applies acceleration scaled by a curve

Spawn position

RectangleSpawnBehaviour(width, height)

CircleSpawnBehaviour(radius)

Texture providers

Texture providers decide which texture a particle uses.

Interface:

initialTexture() for pooled particle creation

textureForSpawn(p) for spawn time selection

optional update(p, dt) (animated textures)

optional onKill(p)

Included providers:

SingleTextureProvider(aliasOrUrl)

WeightedTextureProvider([{backgroundTexture, weight}], fallbackTexture)

AnimatedTextureProvider({ texturePrefix, numberOfFrames, firstFrame?, padLength?, fps?, loop? })

Notes / gotchas

pixi-particles-engine is not published from this repo by default; it’s consumed through workspaces in the sandbox ("pixi-particles-engine": "0.1.0").
