import { GameObject } from '../types/game.js';
import { Game } from './Game.js';

export class Bullet implements GameObject {
  x: number;
  y: number;
  width = 5;
  height = 2;
  
  private speedX: number;
  private speedY: number;
  private game: Game;

  constructor(game: Game, x: number, y: number, speedX: number, speedY: number) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.speedY = speedY;
  }

  update(deltaTime: number): void {
    this.x += this.speedX * deltaTime;
    this.y += this.speedY * deltaTime;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  getX(): number { return this.x; }
  getY(): number { return this.y; }
  getWidth(): number { return this.width; }
  getHeight(): number { return this.height; }
}