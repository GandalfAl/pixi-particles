# pixi-particles-engine — effect recipes

Copy-paste starting points. Read [SKILL.md](SKILL.md) for the rules and
[reference.md](reference.md) for full signatures. Tune numbers to taste; all
assume the referenced texture aliases are already `Assets.load`-ed.

A few shared easing helpers (the package ships none):

```ts
import type { EaseFn } from "pixi-particles-engine";
const easeOutCubic: EaseFn = (x) => 1 - Math.pow(1 - x, 3);
const easeOutBack:  EaseFn = (x) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);
```

---

## 1. Coin fountain (payout / jackpot)

Coins shoot up, arc over under gravity, fade near the end. Fire with
`emitBurst` on a win.

```ts
import {
    Emitter, AnimatedTextureProvider, RadialBurstBehaviour,
    GravityCurveBehaviour, ScaleCurveBehaviour, AlphaCurveBehaviour,
    StaticRotationBehaviour,
} from "pixi-particles-engine";

const coins = new Emitter(
    {
        maxParticles: 250,
        mode: "wave",
        emitting: false,                     // fired on demand
        lifetime: { min: 1.1, max: 1.8 },
        containerOptions: { x: 540, y: 720 },// fountain origin (bottom-center-ish)
        behaviours: [
            // up-and-out cone (−PI/2 = up), decent speed
            new RadialBurstBehaviour(650, 950, -Math.PI / 2, Math.PI / 2.2),
            new StaticRotationBehaviour({ min: -8, max: 8, minAbs: 3 }),
            new GravityCurveBehaviour(0, 1800, [{ time: 0, value: 1 }, { time: 1, value: 1 }]),
            new ScaleCurveBehaviour([{ time: 0, value: 0.9 }, { time: 1, value: 0.7 }]),
            new AlphaCurveBehaviour([
                { time: 0, value: 1 }, { time: 0.75, value: 1 }, { time: 1, value: 0 },
            ]),
        ],
    },
    new AnimatedTextureProvider({ texturePrefix: "Coin_", numberOfFrames: 8, fps: 12 }),
);
scene.addChild(coins);

// on win:
coins.emitBurst(90);
```

> Coins spinning as a flipbook (`Coin_00…`) reads as 3-D rotation. For a flat
> coin sprite, drop the provider to `SingleTextureProvider("Coin")` and let
> `StaticRotationBehaviour` spin it in 2-D.

---

## 2. Confetti win burst

Multi-colored pieces exploding outward, tumbling, drifting down.

```ts
import {
    Emitter, WeightedTextureProvider, CircleSpawnBehaviour,
    RadialBurstBehaviour, GravityCurveBehaviour, StaticRotationBehaviour,
    AlphaBehaviour,
} from "pixi-particles-engine";

const confetti = new Emitter(
    {
        maxParticles: 400,
        mode: "wave",
        emitting: false,
        lifetime: { min: 1.6, max: 2.6 },
        containerOptions: { x: 540, y: 300 },
        behaviours: [
            new CircleSpawnBehaviour(40),                 // small origin cluster
            new RadialBurstBehaviour(400, 800),           // full-circle blast
            new StaticRotationBehaviour({ min: -12, max: 12, minAbs: 4 }),
            new GravityCurveBehaviour(0, 900, [{ time: 0, value: 0.2 }, { time: 1, value: 1 }]),
            new AlphaBehaviour(1, 0),
        ],
    },
    new WeightedTextureProvider(
        [
            { textureId: "ConfettiPink", weight: 1 },
            { textureId: "ConfettiBlue", weight: 1 },
            { textureId: "ConfettiGold", weight: 1 },
        ],
        "ConfettiPink",
    ),
);
scene.addChild(confetti);
confetti.emitBurst(200);
```

---

## 3. Ambient sparkle shimmer (idle reels / logo)

Slow, twinkling sparkles that fade in and out across an area. Continuous, low
rate, additive.

```ts
import {
    Emitter, SingleTextureProvider, RectangleSpawnBehaviour,
    ScaleCurveBehaviour, AlphaCurveBehaviour, StaticRotationBehaviour,
} from "pixi-particles-engine";

const shimmer = new Emitter(
    {
        maxParticles: 120,
        mode: "rate",
        ratePerSecond: 18,
        emitting: true,
        lifetime: { min: 0.8, max: 1.6 },
        containerOptions: { x: 540, y: 540, blendMode: "add" },
        behaviours: [
            new RectangleSpawnBehaviour(900, 900),
            new StaticRotationBehaviour({ min: -1.5, max: 1.5 }),
            // pop in, hold, shrink out
            new ScaleCurveBehaviour([
                { time: 0, value: 0 }, { time: 0.3, value: 1 }, { time: 1, value: 0 },
            ], { defaultEase: easeOutCubic }),
            // twinkle
            new AlphaCurveBehaviour([
                { time: 0, value: 0 }, { time: 0.4, value: 1 }, { time: 0.6, value: 1 }, { time: 1, value: 0 },
            ]),
        ],
    },
    new SingleTextureProvider("Sparkle"),
);
scene.addChild(shimmer);
```

---

## 4. Pulsing glow ring (highlight a winning line / symbol)

A ring of soft glows that breathe. Position the emitter over the symbol.

```ts
import {
    Emitter, SingleTextureProvider, CircleSpawnBehaviour,
    ScaleCurveBehaviour, AlphaCurveBehaviour,
} from "pixi-particles-engine";

const ring = new Emitter(
    {
        maxParticles: 80,
        mode: "rate",
        ratePerSecond: 30,
        emitting: true,
        lifetime: { min: 0.6, max: 0.9 },
        containerOptions: { x: 0, y: 0, blendMode: "add" }, // set x/y onto the symbol
        behaviours: [
            new CircleSpawnBehaviour(120, 110),   // thin ring band
            new ScaleCurveBehaviour([{ time: 0, value: 0.4 }, { time: 1, value: 1.3 }], { defaultEase: easeOutBack }),
            new AlphaCurveBehaviour([{ time: 0, value: 0.9 }, { time: 1, value: 0 }]),
        ],
    },
    new SingleTextureProvider("Glow"),
);
symbolContainer.addChild(ring);
// move it: ring.x = symbol.x; ring.y = symbol.y;
```

---

## 5. Explosion / poof (flipbook)

One-shot animated burst — e.g. a symbol landing or a bomb reveal.

```ts
import { Emitter, AnimatedTextureProvider, CircleSpawnBehaviour, StaticScaleBehaviour } from "pixi-particles-engine";

const poof = new Emitter(
    {
        maxParticles: 20,
        mode: "manual",          // OK here: it's fire-and-forget, but see note
        emitting: false,
        lifetime: { min: 0.5, max: 0.5 },  // match flipbook length: frames/fps
        containerOptions: { blendMode: "add" },
        behaviours: [
            new CircleSpawnBehaviour(10),
            new StaticScaleBehaviour(1.5),
        ],
    },
    new AnimatedTextureProvider({ texturePrefix: "Explosion_", numberOfFrames: 16, fps: 32, loop: false }),
);
scene.addChild(poof);
```

> ⚠️ `mode: "manual"` detaches the ticker — the flipbook won't advance. For a
> self-animating one-shot, use `mode: "wave"` + `emitting: false` (ticker stays
> attached) and call `poof.emitBurst(1)`. Set `lifetime ≈ numberOfFrames / fps`
> so the particle dies exactly when the animation ends.

---

## 6. Rising sparkle trail (falling/rising symbol)

Emit continuously from a moving object by re-positioning the emitter each frame.

```ts
const trail = new Emitter(
    {
        maxParticles: 150,
        mode: "rate",
        ratePerSecond: 60,
        emitting: true,
        lifetime: { min: 0.4, max: 0.8 },
        containerOptions: { blendMode: "add" },
        behaviours: [
            new CircleSpawnBehaviour(12),
            new MovementCurveBehaviour(
                [{ time: 0, value: 0 }],            // vx ≈ 0
                [{ time: 0, value: -40 }, { time: 1, value: -120 }], // drift up, accelerating
            ),
            new ScaleCurveBehaviour([{ time: 0, value: 1 }, { time: 1, value: 0 }]),
            new AlphaBehaviour(1, 0),
        ],
    },
    new SingleTextureProvider("Sparkle"),
);
scene.addChild(trail);

// each frame, glue the emitter to the moving symbol:
app.ticker.add(() => { trail.x = symbol.x; trail.y = symbol.y; });
```

---

## Teardown

Always detach on scene close, or the emitter keeps ticking:

```ts
emitter.destroy();   // or emitter.clearParticles() to just stop the visuals
```
