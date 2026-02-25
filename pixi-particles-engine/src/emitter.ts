import { ParticleContainer, ParticleContainerOptions, ParticleProperties, Ticker } from "pixi.js";
import { Behaviour } from "./behaviour";
import { TextureProvider } from "./texture-provider";
import { PxParticle } from "./px-particle";

export type EmissionMode = "rate" | "wave" | "manual";

export interface EmitterOptions {
    containerOptions?: ParticleContainerOptions;
    maxParticles: number;
    mode: EmissionMode;
    ratePerSecond?: number;
    waveInterval?: number;
    particlesPerWave?: number;
    lifetime: { min: number; max: number };
    emitting?: boolean;
    maxDeltaSeconds?: number;
    behaviours?: Behaviour[];
    addAtBack?: boolean;
    ticker?: Ticker; // Optional custom Ticker
}

type SortedBehaviour = { b: Behaviour; order: number; prio: number };
type DynamicProps = ParticleProperties & Record<string, boolean>;

export class Emitter extends ParticleContainer {
    private maxParticles: number;
    private mode: EmissionMode;
    public ratePerSecond?: number; // for mode="rate"
    public waveInterval?: number; // seconds, for mode="wave"
    public particlesPerWave?: number; // for mode="wave"
    // Particle lifetime
    private lifetime: { min: number; max: number };

    // If true, emitter keeps emitting; if false, you can trigger bursts/waves manually
    public emitting?: boolean;

    /** Clamp to avoid huge steps (tab pause etc). */
    private maxDeltaSeconds: number;

    public addAtBack?: boolean;

    private ticker?: Ticker;

    private textureProvider: TextureProvider;

    private readonly pool: PxParticle[] = [];
    private readonly active: PxParticle[] = [];

    private behaviours: SortedBehaviour[] = [];
    private nextBehaviourOrder = 0;

    private emitAcc = 0; // for rate mode
    private waveAcc = 0; // for wave mode

    constructor(options: EmitterOptions, textureProvider: TextureProvider) {
        super({
            label: "Emitter",
            ...options.containerOptions,
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

        if (options.behaviours) {
            for (const behaviour of options.behaviours) {
                this.addBehaviour(behaviour);
            }
        }

        // Fill the pool with particles
        for (let i = 0; i < this.maxParticles; i++) {
            const p = new PxParticle({ texture: this.textureProvider.initialTexture() });
            this.pool.push(p);
        }

        // If we have manual mode we don't attach it to Ticker instead we manually spawn particles
        if (options.mode != "manual") {
            this.updateEmitter = this.updateEmitter.bind(this);
            if (options.ticker) {
                this.ticker = options.ticker;
            } else {
                this.ticker = Ticker.shared;
            }
            this.ticker.add(this.updateEmitter);
        }
    }

    private addBehaviour(b: Behaviour): this {
        this.behaviours.push({
            b,
            order: this.nextBehaviourOrder++,
            prio: b.priority ?? 0,
        });

        this.behaviours.sort((a, c) => a.prio - c.prio || a.order - c.order);
        b.init?.(this);
        return this;
    }

    public updateEmitter(ticker: Ticker): void {
        const maxDt = this.maxDeltaSeconds;
        let dt = ticker.deltaMS / 1000;

        if (dt > maxDt) dt = maxDt;
        if (dt <= 0) return;

        if (this.emitting) this.emitParticles(dt);

        // Update particles & kill dead ones (iterate backwards for safe splice)
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];

            this.textureProvider.update?.(p, dt);

            p.age += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.angleV * dt;

            // behaviours apply
            for (const entry of this.behaviours) entry.b.apply?.(p, dt, this);

            // lifetime kill
            if (p.age >= p.life) {
                this.killAtIndex(i);
            }
        }
    }

    private emitParticles(dt: number): void {
        if (this.mode === "rate") {
            const rate = this.ratePerSecond ?? 0;
            if (rate <= 0) return;

            this.emitAcc += dt;
            const want = Math.floor(this.emitAcc * rate);
            if (want <= 0) return;

            this.emitAcc -= want / rate;
            for (let i = 0; i < want; i++) this.spawnOne();
            return;
        }

        if (this.mode === "wave") {
            const interval = this.waveInterval ?? 0.25;
            const perWave = this.particlesPerWave ?? 1;
            if (interval <= 0 || perWave <= 0) return;

            this.waveAcc += dt;
            while (this.waveAcc >= interval) {
                this.waveAcc -= interval;
                for (let i = 0; i < perWave; i++) this.spawnOne();
            }
            return;
        }
    }

    private spawnOne(texture?: string): void {
        const p = this.pool.pop();
        if (!p) return; // Maximum capacity reached
        p.texture = this.textureProvider.textureForSpawn(p);
        p.onSpawn(); // IMPORTANT: if behaviour only changes onSpawn value that doesn't cause changes over time we do not need it in DynamicProps
        // spawn hooks
        for (const behaviour of this.behaviours) behaviour.b.onSpawn?.(p, this);
        if (this.addAtBack) {
            this.addParticleAt(p, 0);
        } else {
            this.addParticle(p);
        }

        // lifetime random
        const { min, max } = this.lifetime;
        p.life = min + Math.random() * Math.max(0, max - min);

        this.active.push(p);
    }

    private killAtIndex(activeIndex: number): void {
        const p = this.active[activeIndex];

        // kill hook
        for (let i = this.behaviours.length - 1; i >= 0; i--) {
            this.behaviours[i].b.onKill?.(p, this);
        }

        this.textureProvider.onKill?.(p);
        // kill particle
        p.onKill();

        this.removeParticle(p);

        // remove from active list (swap remove)
        const last = this.active.length - 1;
        if (activeIndex !== last) this.active[activeIndex] = this.active[last];
        this.active.pop();

        this.pool.push(p);
    }

    public clearParticles(): void {
        this.emitAcc = 0;
        this.waveAcc = 0;

        while (this.active.length > 0) {
            this.killAtIndex(this.active.length - 1);
        }
    }

    /** Manual MODE emissions */
    public emitBurst(count: number, texture?: string): void {
        for (let i = 0; i < count; i++) this.spawnOne(texture);
    }
    public emitWave(texture?: string): void {
        const n = this.particlesPerWave ?? 0;
        for (let i = 0; i < n; i++) this.spawnOne(texture);
    }

    private static computeDynamicProperties(behaviours: Behaviour[], provider: TextureProvider): DynamicProps {
        const props: DynamicProps = {
            position: false,
            rotation: false,
            vertex: false,
            uvs: false,
            color: false,
        };

        if (provider.requires) {
            for (const key in provider.requires) {
                props[key] = true;
            }
        }

        for (const b of behaviours) {
            if (!b.requires) continue;

            for (const key in b.requires) {
                props[key] = true;
            }
        }

        return props;
    }
}
