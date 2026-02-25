Executive summary
pixi-particles-engine is a behaviour-driven particle engine built around PixiJS v8’s ParticleContainer + Particle primitives. The design goal is to make it easy to build game-ready “burst / trail / sparkle / explosion” effects while keeping your update loop predictable and your performance knobs explicit (pooling, emission modes, and dynamicProperties).

Under the hood, Pixi v8’s particle system is intentionally minimal: it trades advanced scene-graph features for raw throughput, and exposes a static vs dynamic upload model where you decide which particle properties are uploaded every frame. Your engine aligns with that model by having behaviours declare their requires (dynamic properties), and by integrating motion at the emitter level (velocity → position, angular velocity → rotation).

Key features

Fast base primitive: Built on Pixi v8 ParticleContainer/Particle for high throughput rendering. Pixi’s own docs position ParticleContainer as “highly optimised” and emphasise that particles are lightweight and omit many advanced features.

Behaviour composition: Effects are composed from small Behaviour units (onSpawn, apply, onKill) with priority ordering and stable tie-breaking by registration order (per your interface comment).

Pooling-first: PxParticle instances are preallocated into a pool; dead particles return to the pool.

Emission modes:

rate (particles per second)
wave (bursts on an interval)
manual (explicit emitBurst() / emitWave())
Texture abstraction: A TextureProvider chooses textures on spawn and can optionally animate/update textures per-frame (e.g., flipbook animation), which matches Pixi’s rule that particle containers are fastest when particles share the same texture source and you use atlases/sprite sheets.

Dynamic-properties automation: Behaviours/providers declare requires?: ParticleProperties, and the emitter computes dynamicProperties accordingly, matching Pixi’s “static vs dynamic” design. Pixi stresses that dynamic properties upload every frame, static properties only update on list changes or update().

Installation and quick start
Install
bash
Copy
npm install pixi-particles-engine
npm

Minimal TypeScript quick start
This uses your add-on-spawn + remove-on-kill approach and drives updates from Pixi’s ticker. Pixi v8 ticker callbacks receive the Ticker instance (so your updateEmitter(ticker: Ticker) signature is compatible).

ts
Copy
import { Application } from 'pixi.js';
import {
Emitter,
CircleSpawnBehaviour,
RadialBurstBehaviour,
AlphaCurveBehaviour,
ScaleCurveBehaviour,
AnimatedTextureProvider,
} from 'pixi-particles-engine';

const app = new Application();
document.body.appendChild(app.canvas);

const textureProvider = new AnimatedTextureProvider({
texturePrefix: 'spark\_',
numberOfFrames: 16,
fps: 30,
loop: true,
});

const emitter = new Emitter(
{
maxParticles: 2000,
mode: 'rate',
ratePerSecond: 250,
lifetime: { min: 0.4, max: 1.1 },
emitting: true,
behaviours: [
new CircleSpawnBehaviour(40),
new RadialBurstBehaviour(80, 220, 0, Math.PI \* 2),
new ScaleCurveBehaviour([
{ time: 0, value: 0.2 },
{ time: 0.2, value: 1.0 },
{ time: 1, value: 0.0 },
]),
new AlphaCurveBehaviour([
{ time: 0, value: 1 },
{ time: 1, value: 0 },
]),
],
},
textureProvider,
);

// Important for ParticleContainer: set boundsArea for correct culling/perf.
// Pixi docs note ParticleContainer bounds are not calculated automatically. citeturn4view1
emitter.boundsArea = app.screen;

app.stage.addChild(emitter);

// Your update loop: use Pixi ticker (v8 passes the ticker instance). citeturn5search1turn5search2
app.ticker.add((ticker) => emitter.updateEmitter(ticker));
API summary
Item What it is What you use it for
new Emitter(options, textureProvider) A ParticleContainer subclass Owns pooling, emission, update loop, integration (vx/vy → x/y, angleV → rotation)
Emitter.updateEmitter(ticker) Per-frame update Advances age, integrates motion, runs behaviours, kills dead particles
Emitter.emitBurst(count) Manual emission Spawns count particles immediately
Emitter.emitWave() Manual emission Spawns particlesPerWave particles
Emitter.clearParticles() Reset Kills all active particles and resets emission accumulators
Behaviour Plugin interface init, onSpawn, apply, onKill, and requires for dynamic properties
TextureProvider Texture policy Pick a texture at creation/spawn; optionally update textures per-frame

Core concepts and architecture
How Pixi v8 ParticleContainer shapes the engine
Pixi v8’s ParticleContainer is built for speed and simplicity. Pixi documentation highlights that:

Particles are lightweight and omit advanced features (children, filters, masks, etc.).
Static properties update only when you add/remove particles or call update().
Dynamic properties update every frame; fewer dynamic properties usually means faster rendering.
All particles must share the same texture source (an atlas/sprite sheet is the typical solution).
ParticleContainer bounds are not calculated automatically; you should set boundsArea.
Your architecture leans into this by:

Minimising scene-graph churn for particles themselves (lightweight particles, pooled objects).
Treating dynamicProperties as an explicit contract derived from what behaviours actually animate.
Entity relationships (Mermaid)
mermaid
Copy
flowchart LR
E[Emitter<br/>extends ParticleContainer] -->|spawns/kills| P[PxParticle<br/>extends Particle]
E -->|keeps| Pool[(pool: PxParticle[])]
E -->|updates| Active[(active: PxParticle[])]
E -->|runs| B[Behaviour[]<br/>priority-sorted]
B -->|onSpawn/apply/onKill| P
E -->|delegates textures to| T[TextureProvider]
T -->|initialTexture/textureForSpawn/update| P
Pixi’s primitives referenced here (ParticleContainer and Particle) are documented as performance-focused and intentionally limited; your library should treat these limitations as part of its public contract.

Emission modes (timeline)
mermaid
Copy
sequenceDiagram
participant Time as Time (Ticker frames)
participant E as Emitter

Note over E: mode="rate"
Time->>E: updateEmitter(ticker)
E->>E: accumulate dt; spawn N≈ratePerSecond\*dt

Note over E: mode="wave"
Time->>E: updateEmitter(ticker)
E->>E: if waveAcc>=waveInterval: spawn particlesPerWave

Note over E: mode="manual"
Time->>E: updateEmitter(ticker)
Note over E: spawning occurs only when you call emitBurst/emitWave
Behaviours, dynamic properties, and authoring rules
Dynamic properties: what they mean in Pixi v8
Pixi defines ParticleProperties (aka dynamicProperties) as a per-frame upload contract: set a flag to true if that aspect should be recalculated/uploaded every frame; false means it updates only when manually triggered (or by list changes / update()).

Your engine computes these flags from TextureProvider.requires and each Behaviour.requires, producing dynamicProperties for the underlying ParticleContainer.

Practical rules for this engine’s requires
Rule A: Spawn-only writes don’t need dynamic flags (when using add-on-spawn).
Because your emitter calls p.onSpawn() and behaviour onSpawn(...) before addParticle(...), the initial values are baked into the container when the particle is added. In that pattern, you do not need to mark those properties dynamic unless they will change again in apply(...).

Example: CircleSpawnBehaviour only sets x/y on spawn, so it needs no requires:

ts
Copy
export class CircleSpawnBehaviour implements Behaviour {
public readonly priority = 0;
constructor(private readonly radius: number) {}
public onSpawn(p: PxParticle) {
const a = Math.random() _ Math.PI _ 2;
const r = Math.sqrt(Math.random()) _ this.radius;
p.x = Math.cos(a) _ r;
p.y = Math.sin(a) \* r;
}
}
This aligns with Pixi’s rule that static properties update when you add/remove particles (and you add the particle after assigning x/y).

Rule B: “Causes X to change” should set requires even if it only writes a velocity.
Your emitter integrates:

p.x += p.vx _ dt; p.y += p.vy _ dt;
p.rotation += p.angleV \* dt;
So a behaviour that sets vx/vy (or applies gravity to them) should declare requires.position = true, because it causes x/y to change over time. Likewise, a behaviour that sets angleV should declare requires.rotation = true, because it causes rotation to change over time.

This matches Pixi’s definition of position and rotation flags: they must be true for moving/spinning particles.

Rule C: Animated scale needs vertex: true (because there is no separate scale flag).
Pixi’s v8 ParticleProperties does not include a scale boolean; the only flag that covers per-frame vertex position updates is vertex.

In practice (and as your own ScaleCurveBehaviour encodes), if scaleX/scaleY changes each frame, you should enable vertex: true:

ts
Copy
export class ScaleCurveBehaviour implements Behaviour {
public readonly requires = { vertex: true };
// ... curve setup ...
public apply(p: PxParticle) {
const t = p.life > 0 ? p.age / p.life : 1;
const s = this.curve.sample(t);
p.scaleX = s;
p.scaleY = s;
}
}
Rule D: Animated alpha/tint needs color: true.
Pixi explicitly defines color as the per-frame upload for colour/alpha changes.

Your AlphaBehaviour and AlphaCurveBehaviour correctly declare requires = { color: true }.

Rule E: Texture animation needs uvs: true.
Pixi defines uvs as “texture coordinates updated each frame”; it’s required for texture animation (flipbooks/UV changes).

Your AnimatedTextureProvider declares requires = { uvs: true } and implements update(p, dt) to advance frames—this is the correct usage pattern.

Behaviour examples table
Example Where it writes What it changes over time requires
CircleSpawnBehaviour onSpawn none none
RectangleSpawnBehaviour onSpawn none none
RadialBurstBehaviour onSpawn position changes via vx/vy integration { position: true }
GravityCurveBehaviour apply position changes via vx/vy integration { position: true }
StaticRotationBehaviour onSpawn rotation changes via angleV integration { rotation: true }
AlphaCurveBehaviour apply alpha changes { color: true }
ScaleCurveBehaviour apply scale changes (vertex positions) { vertex: true }
AnimatedTextureProvider update texture/UVs change { uvs: true }

Authoring guidelines
Keep behaviours small and single-purpose:

Spawn-only behaviours should prefer onSpawn and omit requires unless the property changes again later.
Over-time behaviours should implement apply and set requires for whichever dynamic properties are affected (directly or indirectly via integration).
Use priority to order effects (e.g., initialise velocities early; apply velocity curves and gravity consistently). Your engine sorts by priority then stable registration order.
Performance notes, strategy trade-offs, and benchmarking
What Pixi v8 says you should optimise
Pixi’s v8 particle documentation and blog repeat the same core principle: dynamic properties are uploaded every frame, while static properties only update on list mutations or update(); fewer dynamic properties generally equals faster rendering.

Pixi also states two additional performance realities that matter for particle engines:

ParticleContainer bounds are not calculated; set boundsArea yourself.
Structural changes (“changing scene structure”) are measurably more expensive than “not moving” cases in Pixi’s public performance discussion/benchmarks.
Strategy comparison: managing pooled particles
Pixi supports multiple ways to manage the particle list: add/remove via API methods, and direct edits to .particleChildren (followed by update()). Pixi docs explicitly say .particleChildren can be modified directly but you must call update() afterwards.

The table below compares three real-world strategies (the first is a common pattern; the latter two are explicitly described in Pixi docs).

Strategy How it works Pros Cons When to choose
Pre-add all + toggle alpha (common pattern; inference) Add all pooled particles once; “hide” inactive particles by setting alpha to 0 Stable list (fewer structural changes); simple pool Render-side work may still scale with maxParticles; often forces color: true if alpha changes while live; you must manage bounds/culling carefully When most particles are active most of the time and you want minimal list churn
Add-on-spawn / remove-on-kill (your current engine) Only active particles are in the container via addParticle/removeParticle Render list scales with active count; supports static properties naturally on spawn; easier to reason about “active = in container” Many spawns/kills per frame can add CPU overhead from list churn; reordering (addParticleAt) adds overhead When active count is typically far smaller than maxParticles, or multiple emitters are mostly idle
Direct .particleChildren edits + update() batching (Pixi-supported) Manually edit particleChildren and call update() once per batch/frame Maximum control; can reduce per-particle removeParticle overhead; ideal for bulk operations More complex; you must maintain invariants and call update() correctly For extreme particle counts or heavy churn, after profiling shows add/remove is a bottleneck

Pixi explicitly documents the “static properties update on add/remove/update” and the direct particleChildren + update() pattern, which underpin the recommendations above.

Recommended benchmarking checklist
A developer-friendly README should tell users what to measure and why. Here are the most useful tests for this engine:

Measure

CPU time in Emitter.updateEmitter (behaviour cost + integration cost + kill/spawn work).
CPU time inside Pixi’s render step (buffer uploads, list rebuilds).
GC activity / allocations (should be near zero per frame once pooled).
GPU time (especially if color/uvs/vertex are dynamic across many particles).
Test scenarios

Stable scene: spawn once, then no new spawns; compare dynamicProperties sets (position-only vs position+color+vertex+uvs).
High churn: lots of spawns/kills per second (typical “spark shower”).
Sparse vs dense: same maxParticles, but vary typical active count (e.g., 5% vs 80%).
Scale animation: add/remove ScaleCurveBehaviour to see the impact of vertex: true.
Texture animation: animated provider vs single texture.
Expected bottlenecks (what usually dominates)

Turning on more dynamic properties increases per-frame GPU uploads.
Frequent structural updates are costlier than stable scenes, consistent with Pixi’s performance discussion of “changing scene structure” vs “not moving.”
If you don’t set boundsArea, culling/bounds logic can become unpredictable in particle-heavy scenes; Pixi explicitly calls out that bounds aren’t calculated for ParticleContainer.
Pixi v8 compatibility, licence, contributing, npm blurb, changelog template
Pixi v8 compatibility and expectations
This engine targets Pixi v8’s ParticleContainer / Particle pipeline. Pixi’s guides describe this as a high-performance particle system, but also mark it as stable yet experimental (interfaces may evolve).
Use addParticle/removeParticle APIs rather than addChild/removeChild; Pixi explicitly lists common Container APIs as unavailable on ParticleContainer and provides particle-specific alternatives.
If you manage .particleChildren directly, you must call update() afterwards (Pixi’s documented contract).
Ticker integration: Pixi v8’s Ticker.add callbacks receive the Ticker instance, which matches your updateEmitter(ticker: Ticker) signature.
