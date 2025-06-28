import { GameObject } from '../types/game.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { Game } from './Game.js';
export declare class Enemy implements GameObject {
    x: number;
    y: number;
    width: number;
    height: number;
    private game;
    private audioSystem;
    private velocityX;
    private velocityY;
    private pitch;
    private power;
    private maxSpeed;
    private aiState;
    private aiTimer;
    private loopStartTime;
    private lastShot;
    constructor(game: Game, audioSystem: AudioSystem, x: number, y: number);
    update(deltaTime: number): void;
    private executeAI;
    private lerp;
    private shootAtPlayer;
    render(ctx: CanvasRenderingContext2D): void;
    getX(): number;
    getY(): number;
    getWidth(): number;
    getHeight(): number;
}
//# sourceMappingURL=Enemy.d.ts.map