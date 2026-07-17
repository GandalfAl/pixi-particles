---
name: pixi-particles-engine
description: >-
  Use when building particle effects in a PixiJS v8 game that depends on the
  `pixi-particles-engine` package — sparkles, coin/confetti bursts, glows,
  trails, explosions, smoke, win celebrations, ambient shimmer. Covers wiring an
  Emitter into a scene, choosing built-in behaviours + texture providers,
  driving properties with curves, and authoring NEW custom behaviours when the
  built-ins don't cover an effect. Trigger on: "particle", "emitter",
  "behaviour", "sparkle/coin/confetti/explosion/glow effect", "particle burst",
  or "custom behaviour".
---

# pixi-particles-engine

A behaviour-driven, pooled particle engine for **PixiJS v8**. You compose an
effect from three pieces:

1. **`Emitter`** — a `ParticleContainer` subclass that owns a pre-allocated pool
   of particles, spawns them (rate / wave / manual), integrates their motion,
   and recycles them. Add it to any Pixi `Container`.
2. **A `TextureProvider`** — decides which texture each particle uses
   (single / weighted-random / animated flipbook).
3. **`Behaviour[]`** — modular units of logic that initialize particles on spawn
   and mutate them each frame (position, velocity, alpha, scale, rotation…).

> This skill is the field guide. For exhaustive constructor signatures, the full
> particle surface, and the easing/curve API, read **[reference.md](reference.md)**.
> For copy-paste effect setups (coin fountain, confetti win burst, sparkle
> shimmer, glow pulse, explosion), read **[recipes.md](recipes.md)**.

---

## Wiring an emitter into a game

```ts
import { Assets } from "pixi.js";
import {
    Emitter,
    SingleTextureProvider,
    RadialBurstBehaviour,
    AlphaBehaviour,
    ScaleCurveBehaviour,
} from "pixi-particles-engine";

// 1. Textures must be loaded into Pixi's Assets cache first. The provider
//    resolves ids via Texture.from(id), so the alias/URL must already exist.
await Assets.load({ alias: "Sparkle", src: "/assets/Sparkle.png" });

// 2. Build the emitter. dynamicProperties are computed for you — never set them.
const emitter = new Emitter(
    {
        maxParticles: 400,               // hard cap AND pool size (pre-allocated)
        mode: "rate",                    // "rate" | "wave" | "manual"
        ratePerSecond: 120,
        lifetime: { min: 1, max: 2 },    // each particle picks a random life in [min,max]
        emitting: true,
        containerOptions: { blendMode: "add", x: 540, y: 540 }, // position the emitter here
        behaviours: [
            new RadialBurstBehaviour(150, 250),   // initial velocity (priority -80)
            new ScaleCurveBehaviour([             // scale over life  (priority 50)
                { time: 0, value: 0 },
                { time: 0.2, value: 1 },
                { time: 1, value: 0 },
            ]),
            new AlphaBehaviour(1, 0),             // fade out         (priority 50)
        ],
    },
    new SingleTextureProvider("Sparkle"),
);

scene.addChild(emitter); // it's a Pixi Container
```

Key facts:

- **Particle coordinates are relative to the emitter.** Spawn behaviours place
  particles around `(0,0)`; move the whole effect by setting the emitter's
  `x`/`y` (via `containerOptions` or `emitter.x = …`).
- **`maxParticles` is a hard cap.** The pool is allocated up front, so pick a
  value that covers your biggest burst. When the pool is empty, spawns are
  silently dropped.
- **Additive glow** (sparkles, fire, magic) → `blendMode: "add"` or `"screen"`.
- The emitter auto-attaches to `Ticker.shared` unless `mode: "manual"` or you
  pass a custom `ticker`.

---

## Per-frame order (know this before writing behaviours)

Each tick, for every active particle, the emitter does — **in this order**:

1. `textureProvider.update?(p, dt)` (animated flipbooks advance here)
2. Base integration: `age += dt`, `x += vx·dt`, `y += vy·dt`, `rotation += angleV·dt`
3. Every behaviour's `update(p, dt, emitter)` in **priority order**
4. Kill the particle if `age >= life`

On spawn: `textureForSpawn` → particle reset → every behaviour's `onSpawn` (in
priority order) → added to container → `life` randomized.

Consequences:
- Base integration uses the **previous** frame's `vx/vy`. A behaviour that sets
  velocity in `update` takes effect next frame (fine for smooth motion).
- **In `onSpawn`, `p.life` is not final yet** — it's randomized *after* all
  `onSpawn` hooks. Don't compute anything from `p.life` in `onSpawn`. The
  `t = age/life` normalization is only meaningful in `update`.

---

## Rule 1 — Priority ordering

Lower priority runs earlier; ties keep registration order. Behaviours that must
set up state (position, initial velocity) run before behaviours that read it.
The built-ins follow these buckets — match them:

| Priority | Role | Built-ins |
|---|---|---|
| `-100` | Spawn **position** | `CircleSpawnBehaviour`, `RectangleSpawnBehaviour` |
| `-80` | Initial **velocity** | `RadialBurstBehaviour` |
| `-60` | Initial scale / spin | `StaticScaleBehaviour`, `StaticRotationBehaviour` |
| `-10` | Per-frame velocity | `MovementCurveBehaviour` |
| `0` | Forces (accumulate onto velocity) | `GravityCurveBehaviour` (default) |
| `50` | Visual **over lifetime** | `AlphaBehaviour`, `AlphaCurveBehaviour`, `ScaleCurveBehaviour`, `RotationCurveBehaviour` |

When you author a behaviour, pick a priority from the bucket that matches its
job. If a force must modify curve-driven velocity, give the force a **higher**
priority than the movement curve so it runs after it.

## Rule 2 — `requires` (GPU dynamic properties)

PixiJS `ParticleContainer` only re-uploads an attribute to the GPU each frame if
it's marked dynamic. The emitter computes this automatically from every
behaviour's and provider's `requires`. **If your behaviour changes a property
every frame in `update`, you MUST declare it, or the change won't render:**

| Property you animate each frame | `requires` |
|---|---|
| `x` / `y` / `vx` / `vy` (movement) | `{ position: true }` |
| `rotation` (spin over time) | `{ rotation: true }` |
| `alpha` or `tint` | `{ color: true }` |
| `scaleX` / `scaleY` | `{ vertex: true }` |
| swapping `texture` (UVs) | `{ uvs: true }` |

If you only set a property **once in `onSpawn`** and never touch it again, you
usually do **not** need `requires` — the add/remove cycle re-uploads it. Keep
`requires` minimal; every dynamic property costs a per-frame GPU upload.

---

## Authoring a custom behaviour

Reach for this when no built-in produces the effect (e.g. color-shift over life,
attract-to-a-point, turbulence, flicker, sub-emit-on-death).

**The `PxParticle` type is not exported** by the package. Recover it from the
exported `Behaviour` interface — no package change needed:

```ts
import type { Behaviour, Emitter } from "pixi-particles-engine";

// Extract the particle type from the interface's method signature:
type PxParticle = Parameters<NonNullable<Behaviour["update"]>>[0];
```

(Alternatively, if you own the engine, add `export * from "./px-particle";` and
`export * from "./utils";` to `src/index.ts` — then import `PxParticle`/`Utils`
directly. The extraction trick above works without touching the package.)

### Template

```ts
import type { Behaviour, Emitter } from "pixi-particles-engine";
type PxParticle = Parameters<NonNullable<Behaviour["update"]>>[0];

/** Fades tint from `from` to `to` over the particle's lifetime. */
export class TintFadeBehaviour implements Behaviour {
    // Runs in the "visual over lifetime" bucket.
    public readonly priority = 50;
    // We mutate tint every frame → color must be dynamic.
    public readonly requires = { color: true };

    constructor(
        private from: number = 0xffffff,
        private to: number = 0xff3366,
    ) {}

    public onSpawn(p: PxParticle): void {
        p.tint = this.from;
    }

    public update(p: PxParticle, _dt: number, _emitter: Emitter): void {
        const t = p.life > 0 ? Math.min(1, p.age / p.life) : 1; // normalized age
        p.tint = lerpColor(this.from, this.to, t);
    }
}
```

### Rules for a correct behaviour

- **Normalize time as `t = age / life`** (guard `life > 0`) and clamp to `[0,1]`.
- **Declare `requires`** for anything you animate each frame (Rule 2).
- **Pick the right `priority`** (Rule 1). If you read another behaviour's output
  (e.g. velocity it set), run after it.
- **Prefer velocity over direct position.** Set `p.vx/p.vy` and let the emitter
  integrate, rather than writing `p.x +=` yourself (composes with forces, matches
  built-ins). Set position directly only for spawn placement.
- **Spin via `angleVBase` / `angleVScale`**, not by writing `rotation` directly:
  the emitter integrates `rotation += angleVBase·angleVScale·dt`. `angleVBase`
  is the base rad/s (set on spawn); `angleVScale` is a per-frame multiplier
  (curve it for easing). Both are write-only setters; read the product via
  `angleV`.
- **Clean up in `onKill`** any per-particle state you stored (e.g. a custom
  field you stashed on the particle), since particles are pooled and reused.
- **Keep `update` allocation-free** — it runs for every particle every frame.
  No `new`, no array literals, no closures in the hot path.
- **Use `onSpawn` for randomness** so each particle differs (`Math.random()`),
  and cache expensive setup in `init(emitter)`.

Full particle surface (every field you can read/write) is in
**[reference.md](reference.md)**.

---

## Driving effects at runtime (win triggers, etc.)

For a burst you fire on demand (a win, a coin drop) — **don't** use `manual`
mode unless you also run your own update loop (manual mode detaches the ticker,
so nothing animates). Instead keep a ticker-driven mode with `emitting: false`
and call `emitBurst`:

```ts
const winBurst = new Emitter(
    { maxParticles: 300, mode: "wave", emitting: false, /* … */ },
    provider,
);
// on a win:
winBurst.emitBurst(120);   // spawns now; particles animate via the ticker
```

Useful runtime methods on `Emitter`:

- `emitBurst(count)` — spawn `count` immediately.
- `emitWave()` — spawn one `particlesPerWave` batch.
- `clearParticles()` — kill all live particles, reset accumulators.
- `setMode("rate" | "wave" | "manual")` — attaches/detaches the ticker as needed.
- `emitting`, `ratePerSecond`, `waveInterval`, `particlesPerWave` — writable fields.
- `destroy()` — detaches the ticker; **always call on scene teardown** to avoid leaks.

---

## Quick checklist before you ship an effect

- [ ] Textures loaded via `Assets.load` before the provider is constructed.
- [ ] `maxParticles` ≥ peak concurrent particles (rate × lifetime, or burst size).
- [ ] Every per-frame-animated property has a matching `requires`.
- [ ] Behaviour priorities put spawn/position first, visuals last.
- [ ] Emitter positioned via its own `x`/`y`; spawn behaviours are relative to it.
- [ ] `emitter.destroy()` wired into scene close.
