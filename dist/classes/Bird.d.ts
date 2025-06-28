import { GameObject } from '../types/game.js';
import { Game } from './Game.js';
export declare class Bird implements GameObject {
    x: number;
    y: number;
    width: number;
    height: number;
    private _game;
    private velocityX;
    private velocityY;
    private wingTimer;
    private originalY;
    constructor(game: Game, x: number, y: number);
    update(deltaTime: number): void;
    render(ctx: CanvasRenderingContext2D): void;
    getX(): number;
    getY(): number;
    getWidth(): number;
    getHeight(): number;
}
//# sourceMappingURL=Bird.d.ts.map