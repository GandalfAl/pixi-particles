import { Container } from "pixi.js";

export interface Scene extends Container {
    open(): void;
}
