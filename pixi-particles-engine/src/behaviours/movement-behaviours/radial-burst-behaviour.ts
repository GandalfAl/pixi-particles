import { PxParticle } from "../../px-particle";
import { Behaviour } from "../../behaviour";
import { Emitter } from "../../emitter";
import { BehaviourUtils } from "../behaviour-utils";

export class RadialBurstBehaviour implements Behaviour {
    public readonly requires = { position: true };
    readonly priority = 10;

    public minSpeed: number;
    public maxSpeed: number;
    /** center direction in radians (0 = right, PI/2 = down in Pixi coords) */
    public direction: number = 0;
    /** spread in radians (2π = full burst, PI/3 = 60° cone) */
    public spread: number = Math.PI * 2;

    constructor(minSpeed: number, maxSpeed: number, direction: number = 0, spread: number = Math.PI * 2) {
        this.minSpeed = minSpeed;
        this.maxSpeed = maxSpeed;
        this.direction = direction;
        this.spread = spread;
    }

    public onSpawn(p: PxParticle) {
        const half = this.spread * 0.5;
        const angle = this.direction + BehaviourUtils.rand(-half, half);
        const speed = BehaviourUtils.rand(this.minSpeed, this.maxSpeed);

        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
    }
}
