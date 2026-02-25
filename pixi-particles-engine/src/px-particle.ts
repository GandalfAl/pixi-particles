import { Particle, ParticleOptions } from "pixi.js";

export type AnimatedParticleState = {
    t: number; // seconds progressed in animated texture (sprite sheet)
};

export class PxParticle extends Particle {
    public age = 0;
    public life = 1;

    public vx = 0;
    public vy = 0;
    public angleV = 0;

    public animatedParticleState?: AnimatedParticleState;

    constructor(options: ParticleOptions) {
        options.anchorX = 0.5;
        options.anchorY = 0.5;
        super(options);
        this.onKill(); // start pooled/inactive
    }

    /** Put particle into pooled/inactive state. */
    public onKill() {
        this.age = 0;
        this.life = 1;

        this.vx = 0;
        this.vy = 0;
        this.angleV = 0;

        this.animatedParticleState = undefined;
    }

    /** Prepare particle for active use. */
    public onSpawn() {
        this.age = 0;
        this.life = 1;

        this.vx = 0;
        this.vy = 0;
        this.angleV = 0;

        this.animatedParticleState = undefined;

        this.alpha = 1;
        this.tint = 0xffffff;

        this.rotation = 0;
        this.scaleX = 1;
        this.scaleY = 1;

        this.x = 0;
        this.y = 0;
    }
}
