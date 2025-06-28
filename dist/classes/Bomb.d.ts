import { GameObject } from '../types/game.js';
import { Game } from './Game.js';
export declare class Bomb implements GameObject {
    x: number;
    y: number;
    width: number;
    height: number;
    private speedY;
    private _game;
    constructor(game: Game, x: number, y: number);
    update(deltaTime: number): void;
    render(ctx: CanvasRenderingContext2D): void;
    getX(): number;
    getY(): number;
    getWidth(): number;
    getHeight(): number;
}
//# sourceMappingURL=Bomb.d.ts.map