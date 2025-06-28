# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
MegaSop is a side-scrolling biplane shooter game inspired by the classic DOS game Sopwith. Built using HTML5 Canvas and vanilla JavaScript.

## Development Commands
- Open `index.html` in a web browser to run the game
- No build process required - pure HTML/CSS/JS

## Game Controls
- Arrow Keys: Move biplane
- Space: Fire machine gun
- B: Drop bombs

## Code Architecture

### Core Classes
- `Game` (game.js:1): Main game controller handling game loop, collision detection, and state management
- `Player` (game.js:105): Player biplane with movement and weapon systems
- `Enemy` (game.js:162): AI-controlled enemy planes with basic movement patterns
- `Bullet` (game.js:197): Projectile system for machine gun
- `Bomb` (game.js:218): Gravity-affected bomb projectiles

### Game Systems
- **Game Loop**: Uses requestAnimationFrame for smooth 60fps rendering
- **Collision Detection**: Basic AABB collision system between bullets/bombs and enemies
- **Scrolling Background**: Parallax cloud system that moves with game progression
- **Enemy Spawning**: Continuous enemy generation as old enemies scroll off-screen
- **Scoring**: Points awarded for destroying enemies (100 for bullets, 150 for bombs)

### Canvas Rendering
- Game renders at 800x600 resolution
- Sky gradient background from light blue to green
- Simple geometric shapes for plane sprites
- Real-time UI overlay for score display