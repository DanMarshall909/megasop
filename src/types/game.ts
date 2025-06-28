export interface GameConfig {
  width: number;
  height: number;
  maxEnemies: number;
  maxBirds: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface TerrainPoint {
  x: number;
  y: number;
}

export interface GameObject extends Position, Dimensions {
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export interface MovableObject extends GameObject, Velocity {}

export interface SoundNote {
  note: string;
  duration: number;
}

export interface SoundPriority {
  TITLE: number;
  EXPLOSION: number;
  BOMB: number;
  SHOT: number;
  FALLING: number;
  HIT: number;
  PLANE: number;
}

export type GameState = 'title' | 'playing' | 'gameOver';

export type AIState = 'patrol' | 'chase' | 'loop' | 'evade';