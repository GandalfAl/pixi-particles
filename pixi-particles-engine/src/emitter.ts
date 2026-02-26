import { ParticleContainer, ParticleContainerOptions, ParticleProperties, Ticker } from "pixi.js";
import { Behaviour } from "./behaviour";
import { TextureProvider } from "./texture-provider";
import { PxParticle } from "./px-particle";

/**
 * How this emitter produces particles over time:
 * - "rate": continuously emits at a fixed particles-per-second
 * - "wave": emits discrete bursts ("waves") every interval
 * - "manual": user code calls emitBurst/emitWave; no ticker hookup
 */
export type EmissionMode = "rate" | "wave" | "manual";

/**
 * Configuration passed to {@link Emitter}.
 *
 * Notes:
 * - In "rate" mode, you must provide `ratePerSecond`
 * - In "wave" mode, you should provide `waveInterval` and `particlesPerWave`
 * - In "manual" mode, the emitter will NOT auto-update; you trigger emission yourself
 */
export interface EmitterOptions {
    /**
     * Options forwarded to PixiJS ParticleContainer.
     * You can set blendMode, position, etc.
     *
     * NOTE: dynamicProperties are computed automatically based on behaviours + texture provider.
     */
    containerOptions?: ParticleContainerOptions;

    /** Maximum number of particles alive at the same time. Also defines the pool size. */
    maxParticles: number;

    /** Emission strategy (rate / wave / manual). */
    mode: EmissionMode;

    /**
     * Particles per second when mode === "rate".
     */
    ratePerSecond?: number;

    /**
     * Seconds between waves when mode === "wave".
     * If omitted, a default is used.
     */
    waveInterval?: number;

    /**
     * How many particles are spawned each wave when mode === "wave".
     * If omitted, defaults to 1.
     */
    particlesPerWave?: number;

    /** Particle lifetime in seconds. Each particle chooses a random value in [min, max]. */
    lifetime: { min: number; max: number };

    /**
     * If true, the emitter automatically emits according to its mode.
     * If false, particles can still be spawned using manual methods.
     */
    emitting?: boolean;

    /**
     * Clamp delta-time to avoid huge simulation jumps (tab pause, breakpoint, slow frame, etc).
     * This prevents spawning a massive burst and "teleporting" particles.
     */
    maxDeltaSeconds?: number;

    /**
     * Behaviours are modular systems applied to particles.
     * Typical responsibilities:
     * - initialize properties at spawn (velocity, scale, alpha, etc)
     * - update properties each frame (curves, gravity, drag, etc)
     *
     * Behaviours can also declare "requires" to enable ParticleContainer dynamicProperties.
     */
    behaviours?: Behaviour[];

    /**
     * If true, particles are added at index 0 (behind existing children).
     * Useful for layering (e.g. smoke behind sparks).
     */
    addAtBack?: boolean;

    /**
     * Optional custom ticker (e.g. your app ticker).
     * If omitted, uses Ticker.shared.
     */
    ticker?: Ticker;
}

/**
 * Internally we keep behaviours in a stable sorted array:
 * - prio: behaviour priority (lower runs earlier)
 * - order: insertion order to break ties (stable ordering)
 */
type SortedBehaviour = { b: Behaviour; order: number; prio: number };

/**
 * ParticleContainer dynamicProperties config.
 * Pixi uses this to know which particle attributes must be re-uploaded to GPU each frame.
 */
type DynamicProps = ParticleProperties & Record<string, boolean>;

/**
 * Emitter is a ParticleContainer that owns a pool of {@link PxParticle} instances.
 *
 * Core responsibilities:
 * - Keep a pool of particles to avoid allocations during gameplay.
 * - Emit particles according to the selected EmissionMode.
 * - Update active particles each tick (movement, behaviours, textures).
 * - Recycle dead particles back into the pool.
 */
export class Emitter extends ParticleContainer {
    /** Pool capacity / maximum concurrent particles. */
    private maxParticles: number;

    /** Current emission mode. */
    private mode: EmissionMode;

    /** Particles per second for mode="rate". */
    public ratePerSecond?: number;

    /** Wave interval (seconds) for mode="wave". */
    public waveInterval?: number;

    /** Particles per wave for mode="wave". */
    public particlesPerWave?: number;

    /** Lifetime range (seconds) used for each spawned particle. */
    private lifetime: { min: number; max: number };

    /**
     * If true, emission is automatic (rate/wave).
     * If false, update still runs but no new particles are spawned.
     */
    public emitting?: boolean;

    /** Delta clamp to keep simulation stable on long frames. */
    private maxDeltaSeconds: number;

    /** Whether new particles should be added behind existing particles. */
    public addAtBack?: boolean;

    /** Ticker driving updates when not in manual mode. */
    private ticker: Ticker;

    /** Responsible for choosing textures and (optionally) updating animated textures. */
    private textureProvider: TextureProvider;

    /** Inactive particle pool (reused). */
    private readonly pool: PxParticle[] = [];

    /** Active particles currently simulated and rendered. */
    private readonly active: PxParticle[] = [];

    /**
     * Sorted behaviours (priority + stable insertion order).
     * Behaviours are applied in order every frame.
     */
    private behaviours: SortedBehaviour[] = [];
    private nextBehaviourOrder = 0;

    /** Accumulator used to compute spawn counts in rate mode. */
    private emitAcc = 0;

    /** Accumulator used to track time between waves in wave mode. */
    private waveAcc = 0;

    private updateEmitterBound?: (ticker: Ticker) => void;
    private tickerAttached = false;

    constructor(options: EmitterOptions, textureProvider: TextureProvider) {
        super({
            label: "Emitter",
            ...options.containerOptions,

            /**
             * Important optimization:
             * We enable only the dynamic properties that are actually needed
             * (based on behaviours + texture provider requirements).
             */
            dynamicProperties: Emitter.computeDynamicProperties(options.behaviours ?? [], textureProvider),
        });

        this.maxParticles = options.maxParticles;
        this.mode = options.mode;
        this.ratePerSecond = options.ratePerSecond;
        this.waveInterval = options.waveInterval;
        this.particlesPerWave = options.particlesPerWave;
        this.lifetime = options.lifetime;
        this.emitting = options.emitting;
        this.maxDeltaSeconds = options.maxDeltaSeconds ?? 0.1;
        this.addAtBack = options.addAtBack;

        this.textureProvider = textureProvider;

        // Register behaviours (sorted by priority + stable order).
        if (options.behaviours) {
            for (const behaviour of options.behaviours) {
                this.addBehaviour(behaviour);
            }
        }

        /**
         * Pre-allocate particles upfront:
         * - avoids runtime allocations / GC spikes
         * - allows "maxParticles" to be a hard cap
         *
         * Each pooled particle gets an initial texture (required by Pixi Particle).
         * The actual texture may be replaced on spawn by the provider.
         */
        for (let i = 0; i < this.maxParticles; i++) {
            const p = new PxParticle({ texture: this.textureProvider.initialTexture() });
            this.pool.push(p);
        }

        /**
         * In manual mode we do NOT attach to a ticker.
         * User code calls emitBurst/emitWave and also needs to call updateEmitter manually
         * (or you can provide a separate public update method if you prefer).
         *
         * NOTE: currently updateEmitter is still public and can be called manually.
         */
        this.ticker = options.ticker ?? Ticker.shared;
        if (this.mode !== "manual") {
            this.attachTicker();
        }
    }

    /**
     * Adds a behaviour and inserts it into the sorted execution order.
     * Priority controls order; ties are resolved by insertion order.
     */
    private addBehaviour(b: Behaviour): this {
        this.behaviours.push({
            b,
            order: this.nextBehaviourOrder++,
            prio: b.priority ?? 0,
        });

        // lower priority runs earlier
        this.behaviours.sort((a, c) => a.prio - c.prio || a.order - c.order);

        // Optional init hook for behaviour to cache references or precompute curves.
        b.init?.(this);
        return this;
    }

    /**
     * Ticker callback: advances simulation and handles emission.
     *
     * The emitter uses ticker.deltaMS (milliseconds between frames) converted to seconds.
     * We clamp dt to maxDeltaSeconds to avoid large jumps and excessive spawning.
     */
    public updateEmitter(ticker: Ticker): void {
        const maxDt = this.maxDeltaSeconds;
        let dt = ticker.deltaMS / 1000;

        // Clamp dt for stability (e.g. tab in background).
        if (dt > maxDt) dt = maxDt;
        if (dt <= 0) return;

        // Spawn new particles if enabled.
        if (this.emitting) this.emitParticles(dt);

        /**
         * Update particles & kill dead ones.
         * Iterate backwards so we can remove by index safely.
         */
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];

            // Texture provider may animate / swap textures per frame.
            this.textureProvider.update?.(p, dt);

            // Base integrator: apply velocity and angular velocity.
            // Behaviours can also modify velocity, position, rotation, etc.
            p.age += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.angleV * dt;

            // Apply behaviours in sorted order.
            for (const entry of this.behaviours) entry.b.update?.(p, dt, this);

            // Kill particle if it exceeded its lifetime.
            if (p.age >= p.life) {
                this.killAtIndex(i);
            }
        }
    }

    /**
     * Emits particles according to the emitter's mode.
     * This method is called automatically each tick when emitting=true.
     */
    private emitParticles(dt: number): void {
        if (this.mode === "rate") {
            const rate = this.ratePerSecond ?? 0;
            if (rate <= 0) return;

            /**
             * Accumulate fractional time and convert into "how many particles should we emit".
             * This produces stable emission even with variable frame rates.
             */
            this.emitAcc += dt;
            const want = Math.floor(this.emitAcc * rate);
            if (want <= 0) return;

            // Keep the remainder time after spawning `want` particles.
            this.emitAcc -= want / rate;

            for (let i = 0; i < want; i++) this.spawnOne();
            return;
        }

        if (this.mode === "wave") {
            const interval = this.waveInterval ?? 0.25;
            const perWave = this.particlesPerWave ?? 1;
            if (interval <= 0 || perWave <= 0) return;

            // Emit full waves when the accumulated time crosses the interval.
            this.waveAcc += dt;
            while (this.waveAcc >= interval) {
                this.waveAcc -= interval;
                for (let i = 0; i < perWave; i++) this.spawnOne();
            }
            return;
        }
    }

    /**
     * Spawns a single particle from the pool.
     *
     * IMPORTANT:
     * - If the pool is empty, spawning is skipped (hard cap).
     * - Texture is selected by TextureProvider at spawn time.
     * - Behaviours' onSpawn hooks initialize per-particle state.
     */
    private spawnOne(): void {
        const p = this.pool.pop();
        if (!p) return;

        if (this.textureProvider.textureForSpawn) p.texture = this.textureProvider.textureForSpawn(p);

        p.onSpawn();

        // Allow behaviours to initialize the particle for this spawn.
        for (const behaviour of this.behaviours) behaviour.b.onSpawn?.(p, this);

        // Add particle to the container (front or back).
        if (this.addAtBack) {
            this.addParticleAt(p, 0);
        } else {
            this.addParticle(p);
        }

        // Randomize lifetime in [min, max].
        const { min, max } = this.lifetime;
        p.life = min + Math.random() * Math.max(0, max - min);

        this.active.push(p);
    }

    /**
     * Kills and recycles a particle at a given index in the active list.
     *
     * Order of operations:
     * 1) behaviour kill hooks (reverse order, mirroring teardown)
     * 2) provider kill hook
     * 3) reset particle instance
     * 4) remove from container + active list
     * 5) return to pool
     */
    private killAtIndex(activeIndex: number): void {
        const p = this.active[activeIndex];

        // Call behaviours' teardown in reverse to match common init/apply ordering expectations.
        for (let i = this.behaviours.length - 1; i >= 0; i--) {
            this.behaviours[i].b.onKill?.(p, this);
        }

        this.textureProvider.onKill?.(p);

        p.onKill();

        this.removeParticle(p);

        /**
         * Remove from active list using "swap remove":
         * - O(1)
         * - does not preserve ordering (fine for particle sims)
         */
        const last = this.active.length - 1;
        if (activeIndex !== last) this.active[activeIndex] = this.active[last];
        this.active.pop();

        this.pool.push(p);
    }

    /**
     * Immediately kills all active particles and resets emission accumulators.
     * Useful when restarting an effect or changing scenes.
     */
    public clearParticles(): void {
        this.emitAcc = 0;
        this.waveAcc = 0;

        while (this.active.length > 0) {
            this.killAtIndex(this.active.length - 1);
        }
    }

    /**
     * Manual emission helpers.
     * Only relevant if mode === "manual" or emitting === false.
     */
    public emitBurst(count: number): void {
        for (let i = 0; i < count; i++) this.spawnOne();
    }

    public emitWave(): void {
        const n = this.particlesPerWave ?? 0;
        for (let i = 0; i < n; i++) this.spawnOne();
    }

    /**
     * Computes ParticleContainer dynamicProperties from:
     * - TextureProvider.requires
     * - each Behaviour.requires
     *
     * Keeping these minimal is important for performance:
     * enabling extra dynamic properties can increase per-frame GPU uploads.
     */
    private static computeDynamicProperties(behaviours: Behaviour[], provider: TextureProvider): DynamicProps {
        const props: DynamicProps = {
            position: false,
            rotation: false,
            vertex: false,
            uvs: false,
            color: false,
        };

        // Texture provider may require updates like uvs (animated textures) or vertex.
        if (provider.requires) {
            for (const key in provider.requires) {
                props[key] = true;
            }
        }

        // Behaviours declare which GPU-updated properties they touch over time.
        for (const b of behaviours) {
            if (!b.requires) continue;

            for (const key in b.requires) {
                props[key] = true;
            }
        }

        return props;
    }

    /**
     * Attaches the emitter update loop to the configured ticker.
     */
    private attachTicker(): void {
        if (this.tickerAttached) return;
        if (!this.updateEmitterBound) {
            this.updateEmitterBound = this.updateEmitter.bind(this);
        }

        if (!this.ticker) {
            this.ticker = Ticker.shared;
        }

        this.ticker.add(this.updateEmitterBound);
        this.tickerAttached = true;
    }

    /**
     * Detaches the emitter update loop from the ticker.
     */
    private detachTicker(): void {
        if (!this.tickerAttached) return;
        if (!this.ticker || !this.updateEmitterBound) return;
        this.ticker.remove(this.updateEmitterBound);
        this.tickerAttached = false;
    }

    /**
     * Changes the emission mode at runtime.
     *
     * - Switching to "manual" detaches the ticker.
     * - Switching to "rate" or "wave" attaches the ticker.
     *
     */
    public setMode(mode: EmissionMode): void {
        if (this.mode === mode) return;

        const wasManual = this.mode === "manual";
        const willBeManual = mode === "manual";

        this.mode = mode;

        if (!wasManual && willBeManual) {
            this.detachTicker();
        } else if (wasManual && !willBeManual) {
            this.attachTicker();
        }
    }

    public override destroy(options?: any): void {
        this.detachTicker();
        super.destroy(options);
    }
}
