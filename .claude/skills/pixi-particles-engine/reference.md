# pixi-particles-engine — API reference

Complete surface for `pixi-particles-engine`. Read [SKILL.md](SKILL.md) first for
the mental model and the two hard rules (priority, `requires`).

Everything below is exported from the package root:

```ts
import {
    Emitter, EmitterOptions, EmissionMode,
    TextureProvider,
    SingleTextureProvider, WeightedTextureProvider,
    AnimatedTextureProvider, AnimatedTextureProviderOptions,
    Behaviour,
    CircleSpawnBehaviour, RectangleSpawnBehaviour,
    RadialBurstBehaviour,
    MovementCurveBehaviour, GravityCurveBehaviour,
    StaticScaleBehaviour, StaticRotationBehaviour,
    AlphaBehaviour, AlphaCurveBehaviour,
    ScaleCurveBehaviour, RotationCurveBehaviour,
    Curve, CurveKeyframe, CurveOptions, EaseFn,
} from "pixi-particles-engine";
```

**Not exported:** `PxParticle`, `Utils`. See SKILL.md for how to recover the
`PxParticle` type. `Utils` is trivial (`lerp`, `clamp01`, `rand`) — reimplement
locally if needed.

---

## Emitter

```ts
new Emitter(options: EmitterOptions, textureProvider: TextureProvider)
```

`Emitter extends ParticleContainer` (a Pixi `Container`) — add it to a scene,
set `x`/`y`, `blendMode`, `alpha`, etc.

### EmitterOptions

| Field | Type | Notes |
|---|---|---|
| `maxParticles` | `number` | **Required.** Hard cap + pre-allocated pool size. |
| `mode` | `"rate" \| "wave" \| "manual"` | **Required.** Emission strategy. |
| `lifetime` | `{ min: number; max: number }` | **Required.** Seconds; each spawn picks a random value in range. |
| `ratePerSecond` | `number` | Used when `mode: "rate"`. Particles/sec. |
| `waveInterval` | `number` | Used when `mode: "wave"`. Seconds between waves (default `0.25`). |
| `particlesPerWave` | `number` | Used when `mode: "wave"`. Count per wave (default `1`). |
| `emitting` | `boolean` | If false, no auto-spawn; particles still update. Use with `emitBurst`. |
| `behaviours` | `Behaviour[]` | Applied in priority order. |
| `containerOptions` | `ParticleContainerOptions` | Pixi passthrough: `x`, `y`, `blendMode`, `label`, `alpha`, `roundPixels`… **Do not set `dynamicProperties`** — computed automatically. |
| `addAtBack` | `boolean` | Insert new particles behind existing ones (layering, e.g. smoke behind sparks). |
| `maxDeltaSeconds` | `number` | Delta-time clamp (default `0.1`) — prevents burst/teleport after a stall. |
| `ticker` | `Ticker` | Custom ticker; defaults to `Ticker.shared`. |

### Emission modes

- **`"rate"`** — continuous, `ratePerSecond` particles/sec (fractional-time
  accumulator, frame-rate independent). Peak concurrent ≈ `ratePerSecond ×
  lifetime.max`; size `maxParticles` accordingly.
- **`"wave"`** — every `waveInterval` seconds, spawn `particlesPerWave` at once.
- **`"manual"`** — **ticker NOT attached**; nothing updates automatically. Only
  use if you drive `updateEmitter(ticker)` yourself. For on-demand bursts,
  prefer `mode: "rate"/"wave"` + `emitting: false` + `emitBurst()`.

### Runtime methods & fields

| Member | Description |
|---|---|
| `emitBurst(count: number)` | Spawn `count` particles immediately. |
| `emitWave()` | Spawn one `particlesPerWave` batch immediately. |
| `clearParticles()` | Kill all active particles; reset rate/wave accumulators. |
| `setMode(mode)` | Change emission mode; attaches/detaches ticker as needed. |
| `updateEmitter(ticker)` | The tick step. Call yourself only in `manual` mode. |
| `destroy(options?)` | Detaches ticker, destroys container. Call on teardown. |
| `emitting` | `boolean` — toggle auto-emission live. |
| `ratePerSecond` / `waveInterval` / `particlesPerWave` | Writable live. |
| `addAtBack` | Writable live. |

---

## Particle surface (`PxParticle`)

Fields a behaviour can read/write. Anchor is centered (`0.5, 0.5`) by default.

| Field | R/W | Meaning |
|---|---|---|
| `x`, `y` | R/W | Position (px), **relative to the emitter**. Integrated from velocity each frame. |
| `vx`, `vy` | R/W | Velocity (px/s). Emitter applies `x += vx·dt` each frame. |
| `age` | R | Seconds since spawn. |
| `life` | R | Total lifetime (s). Randomized *after* `onSpawn`. Use `t = age/life` in `update`. |
| `rotation` | R/W | Angle (radians). Integrated from `angleV` each frame. |
| `angleVBase` | W (setter) | Base angular velocity (rad/s). Set on spawn. |
| `angleVScale` | W (setter) | Multiplier on `angleVBase` (curve it for eased spin). |
| `angleV` | R (getter) | `angleVBase × angleVScale` — the integrated rate. |
| `alpha` | R/W | Opacity `[0,1]`. Needs `requires:{color:true}` if animated. |
| `tint` | R/W | `0xRRGGBB` multiply tint. Needs `{color:true}` if animated. |
| `scaleX`, `scaleY` | R/W | Scale. Needs `{vertex:true}` if animated. |
| `texture` | R/W | Current `Texture`. Needs `{uvs:true}` if swapped over time. |

To store custom per-particle state, stash a field on the particle in `onSpawn`
and clear it in `onKill` (particles are pooled and reused).

---

## Built-in behaviours

Each row lists the constructor, its `priority`, and its `requires`.

### Spawn placement (priority -100)

```ts
new CircleSpawnBehaviour(radius: number, innerRadius = 0)
```
Uniform-area placement in a disc/ring centered on the emitter. `requires`: none
(spawn-only).

```ts
new RectangleSpawnBehaviour(width, height, innerWidth = 0, innerHeight = 0)
```
Uniform placement in a rectangle, optionally hollow (a border band). `requires`:
none.

### Initial velocity (priority -80)

```ts
new RadialBurstBehaviour(minSpeed, maxSpeed, direction = 0, spread = Math.PI*2)
```
On spawn, picks a random angle in `[direction ± spread/2]` and speed in
`[minSpeed, maxSpeed]`, sets `vx/vy`. `direction` in radians (`0`=right,
`PI/2`=down). `spread = 2π` → full circle; `PI/3` → 60° cone. `requires:
{position:true}`.

### Initial scale / spin (priority -60)

```ts
new StaticScaleBehaviour(spawnScale: number)
```
Sets `scaleX = scaleY = spawnScale` on spawn. `requires`: none.

```ts
new StaticRotationBehaviour(
  speed: number | { min: number; max: number; minAbs?: number }
)
```
Sets angular velocity on spawn. Number = fixed rad/s; object = random range.
`minAbs` excludes the slow center, e.g. `{min:-3,max:3,minAbs:2}` →
`[-3..-2] ∪ [2..3]` (guarantees visible spin). `requires: {rotation:true}`.

### Per-frame motion (priority -10 / 0)

```ts
new MovementCurveBehaviour(vxKeyframes, vyKeyframes, opts?: CurveOptions)
```
Overwrites `vx = vxCurve(t)`, `vy = vyCurve(t)` every frame from curves.
`requires: {position:true}`. Priority `-10`.

```ts
new GravityCurveBehaviour(gx, gy, strengthKeyframes, opts?: CurveOptions)
```
Accumulates acceleration: `v += (gx,gy)·strength(t)·dt` each frame. Ramp gravity
or wind in/out via the strength curve. `requires: {position:true}`. Priority `0`
— runs after `MovementCurveBehaviour`, so it modifies curve-driven velocity.

### Visual over lifetime (priority 50)

```ts
new AlphaBehaviour(startAlpha = 1, endAlpha = 0)
```
Linear alpha fade over life. `requires: {color:true}`.

```ts
new AlphaCurveBehaviour(keyframes, opts?)   // output auto-clamped to [0,1]
```
Alpha from a curve — e.g. fade-in then fade-out. `requires: {color:true}`.

```ts
new ScaleCurveBehaviour(keyframes, opts?)
```
Uniform `scaleX = scaleY = curve(t)` over life. `requires: {vertex:true}`.

```ts
new RotationCurveBehaviour(keyframes, opts?)
```
Drives `angleVScale = curve(t)` over life — eases an existing spin (pair with
`StaticRotationBehaviour` to set the base rate). Note: this built-in declares
`requires:{color:true}`; when combined with `StaticRotationBehaviour`
(`{rotation:true}`) rotation is dynamic. If you spin a particle **only** via a
curve, ensure something enables `{rotation:true}`.

---

## Texture providers

```ts
new SingleTextureProvider(textureId: string)
```
Same texture for every particle. `textureId` is passed to `Texture.from()` —
must already be loaded in `Assets`.

```ts
new WeightedTextureProvider(
  items: { textureId: string; weight: number }[],
  fallbackTextureId: string,
)
```
Random texture per spawn by weight (variety: debris, differently-shaped sparks).

```ts
new AnimatedTextureProvider({
  texturePrefix: string,   // frames are `${prefix}${paddedIndex}`
  numberOfFrames: number,
  firstFrame?: number,     // default 0
  padLength?: number,      // default = digit count of numberOfFrames
  fps?: number,            // default 60
  loop?: boolean,          // default true
})
```
Flipbook — swaps `texture` each frame. `requires: {uvs:true}`. Example:
`{ texturePrefix: "Explosion_", numberOfFrames: 16, padLength: 3 }` resolves
`Explosion_000 … Explosion_015`. Load each frame's alias into `Assets` first
(e.g. from a spritesheet).

### Custom provider

Implement `TextureProvider`: `initialTexture()` (required, pool construction),
`textureForSpawn?(p)`, `update?(p, dt)`, `onKill?(p)`, and `requires?`. Same
`requires` rules as behaviours (declare `{uvs:true}` if you swap textures over
time).

---

## Curves & easing

```ts
type CurveKeyframe = { time: number; value: number; ease?: EaseFn };
type CurveOptions = { defaultEase?: EaseFn; clamp?: { min: number; max: number } };
type EaseFn = (x: number) => number;   // x in [0,1] → eased [0,1]

new Curve(keyframes: CurveKeyframe[], opts?: CurveOptions)
curve.sample(t01: number): number      // t clamped to [0,1]
```

- `time` is **normalized lifetime `[0,1]`**, not seconds.
- Keyframes are sorted; endpoints at `t=0` and `t=1` are auto-added if missing.
- `ease` on a keyframe applies to the segment **starting** at that keyframe
  (keyframe → next). `defaultEase` fills segments with no `ease`.
- Interpolation between keyframe values is linear (the `ease` reshapes `t`
  within the segment).

**No easing functions ship with the package.** Supply your own `EaseFn`:

```ts
const easeOutCubic:  EaseFn = (x) => 1 - Math.pow(1 - x, 3);
const easeInCubic:   EaseFn = (x) => x * x * x;
const easeOutBack:   EaseFn = (x) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);
const easeOutBounce: EaseFn = (x) => {
    const n1 = 7.5625, d1 = 2.75;
    if (x < 1 / d1) return n1 * x * x;
    if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
    if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
};

new ScaleCurveBehaviour(
    [{ time: 0, value: 0 }, { time: 1, value: 1.4 }],
    { defaultEase: easeOutBack },
);
```

Curves are reusable from custom behaviours — import `Curve` and sample it in
`update`.
