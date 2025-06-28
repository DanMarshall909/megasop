import { GameObject } from '../types/game.js';
import { Game } from './Game.js';

export class Bomb implements GameObject {
  x: number;
  y: number;
  width = 8;
  height = 12;
  
  private speedY = 200;
  private _game: Game;

  constructor(game: Game, x: number, y: number) {
    this._game = game;
    this.x = x;
    this.y = y;
  }

  update(deltaTime: number): void {
    this.y += this.speedY * deltaTime;
    this.speedY += 100 * deltaTime; // Gravity acceleration
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  getX(): number { return this.x; }
  getY(): number { return this.y; }
  getWidth(): number { return this.width; }
  getHeight(): number { return this.height; }
}