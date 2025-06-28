# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
MegaSop is a side-scrolling biplane shooter game inspired by the classic DOS game Sopwith. Built using HTML5 Canvas and vanilla JavaScript.

## Development Commands
- Open `index.html` in a web browser to run the game
- No build process required - pure HTML/CSS/JS

## Game Controls
- Arrow Keys Up/Down: Continuous roll/pitch (hold for barrel rolls)
- Arrow Keys Left/Right: Power down/up
- Space: Fire machine gun
- B: Drop bombs
- F: Toggle fullscreen
- Any key on title screen: Start game

## Code Architecture

### Core Classes
- `Game` (game.js:1): Main game controller with authentic PC speaker sound system and game states
- `Player` (game.js:566): Player biplane with realistic flight physics and health system
- `Enemy` (game.js:734): AI-controlled enemy planes with loop maneuvers and combat AI
- `Bullet` (game.js:922): Player projectile system for machine gun
- `Bomb` (game.js:943): Gravity-affected bomb projectiles with realistic physics
- `EnemyBullet` (game.js:964): Enemy projectile system with targeting

### Game Systems
- **Authentic Audio**: PC Speaker sound emulation with priority system faithful to original Sopwith
- **Title Screen**: Classic title screen with authentic melody and game information
- **Realistic Physics**: Lift, drag, thrust, and stall mechanics for authentic flight simulation
- **Health System**: Player damage from crashes and enemy bullets with visual health bar
- **AI Combat**: Enemy planes perform loops, chase player, and fire targeted bullets
- **Terrain Collision**: Procedural terrain with realistic crash damage based on impact speed
- **Game States**: Title screen, gameplay, and game over states with seamless transitions

### Canvas Rendering
- Game renders at 800x600 resolution
- Sky gradient background from light blue to green
- Simple geometric shapes for plane sprites
- Real-time UI overlay for score display