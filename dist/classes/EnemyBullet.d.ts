import { GameObject } from '../types/game.js';
import { Game } from './Game.js';
export declare class EnemyBullet implements GameObject {
    x: number;
    y: number;
    width: number;
    height: number;
    private speedX;
    private speedY;
    private game;
    constructor(game: Game, x: number, y: number, speedX: number, speedY: number);
    update(deltaTime: number): void;
    render(ctx: CanvasRenderingContext2D): void;
    getX(): number;
    getY(): number;
    getWidth(): number;
    getHeight(): number;
}
//# sourceMappingURL=EnemyBullet.d.ts.map