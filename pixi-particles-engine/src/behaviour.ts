import { ParticleProperties } from "pixi.js";
import { Emitter } from "./emitter";
import { PxParticle } from "./px-particle";

export interface Behaviour {
    /** Lower runs earlier; stable tie-break by registration order. */
    readonly priority?: number;
    readonly requires?: ParticleProperties; // Which particle properties the Behaviour changes

    init?(emitter: Emitter): void;
    onSpawn?(p: PxParticle, emitter: Emitter): void;
    apply?(p: PxParticle, dt: number, emitter: Emitter): void;
    onKill?(p: PxParticle, emitter: Emitter): void;
}
