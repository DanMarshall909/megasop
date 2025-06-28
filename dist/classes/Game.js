import { AudioSystem } from '../systems/AudioSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { Bird } from './Bird.js';
export class Game {
    constructor() {
        this.keys = {};
        this.lastTime = 0;
        // Game state
        this.gameState = 'title';
        this.titleTimer = 0;
        this.score = 0;
        this.cameraX = 0;
        this.cameraY = 0;
        this.scrollOffset = 0;
        this.bullets = [];
        this.bombs = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.birds = [];
        this.terrain = [];
        // Configuration
        this.config = {
            width: 800,
            height: 600,
            maxEnemies: 3,
            maxBirds: 5
        };
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.audioSystem = new AudioSystem();
        this.renderSystem = new RenderSystem(this.ctx, this.width, this.height);
        this.player = new Player(this, this.audioSystem);
        this.setupEventListeners();
        this.init();
    }
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            // Fullscreen toggle
            if (e.key === 'f' || e.key === 'F') {
                this.toggleFullscreen();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        // Handle fullscreen changes
        document.addEventListener('fullscreenchange', () => {
            this.handleFullscreenChange();
        });
    }
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.canvas.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        }
        else {
            document.exitFullscreen();
        }
    }
    handleFullscreenChange() {
        if (document.fullscreenElement) {
            // Entered fullscreen - resize canvas
            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';
            this.canvas.style.objectFit = 'contain';
        }
        else {
            // Exited fullscreen - restore original size
            this.canvas.style.width = '';
            this.canvas.style.height = '';
            this.canvas.style.objectFit = '';
        }
    }
    init() {
        this.gameState = 'title';
        this.titleTimer = 0;
        this.score = 0;
        this.cameraX = 0;
        this.cameraY = 0;
        this.scrollOffset = 0;
        // Reset arrays
        this.bullets = [];
        this.bombs = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.birds = [];
        // Generate terrain
        this.terrain = this.generateTerrain();
        // Spawn initial objects
        this.spawnEnemies();
        this.spawnBirds();
    }
    generateTerrain() {
        const terrain = [];
        const terrainLength = 10000;
        const baseHeight = this.height - 100;
        for (let x = 0; x < terrainLength; x += 20) {
            const height1 = Math.sin(x * 0.005) * 80;
            const height2 = Math.sin(x * 0.01) * 40;
            const height3 = Math.sin(x * 0.02) * 20;
            const terrainHeight = baseHeight + height1 + height2 + height3;
            terrain.push({ x, y: terrainHeight });
        }
        return terrain;
    }
    getTerrainHeightAt(x) {
        for (let i = 0; i < this.terrain.length - 1; i++) {
            if (x >= this.terrain[i].x && x <= this.terrain[i + 1].x) {
                const t = (x - this.terrain[i].x) / (this.terrain[i + 1].x - this.terrain[i].x);
                return this.terrain[i].y + t * (this.terrain[i + 1].y - this.terrain[i].y);
            }
        }
        return this.height - 100;
    }
    spawnEnemies() {
        for (let i = 0; i < this.config.maxEnemies; i++) {
            const spawnX = this.cameraX + this.width + i * 300;
            const spawnY = Math.random() * (this.height - 200) + 100;
            this.enemies.push(new Enemy(this, this.audioSystem, spawnX, spawnY));
        }
    }
    spawnBirds() {
        for (let i = 0; i < this.config.maxBirds; i++) {
            const spawnX = this.cameraX + this.width + Math.random() * 500;
            const spawnY = Math.random() * (this.height - 300) + 50;
            this.birds.push(new Bird(this, spawnX, spawnY));
        }
    }
    update(deltaTime) {
        if (this.gameState === 'title') {
            this.audioSystem.updateTitleMusic(deltaTime);
            this.titleTimer += deltaTime;
            // Start game on any key press
            if (Object.values(this.keys).some(key => key)) {
                this.startGame();
            }
            return;
        }
        if (this.gameState !== 'playing')
            return;
        this.scrollOffset += 50 * deltaTime;
        this.player.update(deltaTime);
        // Play engine sound occasionally for ambience
        if (Math.random() < 0.02) {
            this.audioSystem.playEngineSound(this.player.getPower());
        }
        // Update camera to follow player
        this.cameraX = this.player.getX() - this.width / 2;
        this.cameraY = this.player.getY() - this.height / 2;
        // Update bullets
        this.bullets = this.bullets.filter((bullet, index) => {
            bullet.update(deltaTime);
            const outOfBounds = bullet.getX() > this.cameraX + this.width + 100 ||
                bullet.getX() < this.cameraX - 100 ||
                bullet.getY() > this.cameraY + this.height + 100 ||
                bullet.getY() < this.cameraY - 100;
            return !outOfBounds;
        });
        // Update bombs
        this.bombs = this.bombs.filter((bomb) => {
            bomb.update(deltaTime);
            return bomb.getY() <= this.cameraY + this.height + 100;
        });
        // Update enemies
        this.enemies.forEach((enemy, index) => {
            enemy.update(deltaTime);
            if (enemy.getX() < this.cameraX - 200) {
                this.enemies.splice(index, 1);
                this.enemies.push(new Enemy(this, this.audioSystem, this.cameraX + this.width + 200, Math.random() * (this.height - 200) + 100));
            }
        });
        // Update enemy bullets
        this.enemyBullets = this.enemyBullets.filter((bullet) => {
            bullet.update(deltaTime);
            const outOfBounds = bullet.getX() > this.cameraX + this.width + 100 ||
                bullet.getX() < this.cameraX - 100 ||
                bullet.getY() > this.cameraY + this.height + 100 ||
                bullet.getY() < this.cameraY - 100;
            return !outOfBounds;
        });
        // Update birds
        this.birds.forEach((bird, index) => {
            bird.update(deltaTime);
            if (bird.getX() < this.cameraX - 200) {
                this.birds.splice(index, 1);
                const spawnX = this.cameraX + this.width + Math.random() * 200;
                const spawnY = Math.random() * (this.height - 300) + 50;
                this.birds.push(new Bird(this, spawnX, spawnY));
            }
        });
        this.checkCollisions();
    }
    startGame() {
        this.gameState = 'playing';
        this.audioSystem.resetTitleMusic();
        // Reset game state
        this.score = 0;
        this.player.reset(100, this.height / 2);
        // Clear arrays and respawn objects
        this.bullets = [];
        this.bombs = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.birds = [];
        this.spawnEnemies();
        this.spawnBirds();
    }
    checkCollisions() {
        // Player bullets hitting enemies
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isColliding(bullet, enemy)) {
                    this.bullets.splice(bulletIndex, 1);
                    this.enemies.splice(enemyIndex, 1);
                    this.score += 100;
                    this.audioSystem.playExplosionSound();
                    this.enemies.push(new Enemy(this, this.audioSystem, this.cameraX + this.width + 200, Math.random() * (this.height - 200) + 100));
                }
            });
        });
        // Player bombs hitting enemies
        this.bombs.forEach((bomb, bombIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isColliding(bomb, enemy)) {
                    this.bombs.splice(bombIndex, 1);
                    this.enemies.splice(enemyIndex, 1);
                    this.score += 150;
                    this.audioSystem.playExplosionSound();
                    this.enemies.push(new Enemy(this, this.audioSystem, this.cameraX + this.width + 200, Math.random() * (this.height - 200) + 100));
                }
            });
        });
        // Enemy bullets hitting player
        this.enemyBullets.forEach((bullet, bulletIndex) => {
            if (this.isColliding(bullet, this.player)) {
                this.enemyBullets.splice(bulletIndex, 1);
                this.player.takeDamage(15);
                this.audioSystem.playHitSound();
            }
        });
    }
    isColliding(obj1, obj2) {
        return obj1.getX() < obj2.getX() + obj2.getWidth() &&
            obj1.getX() + obj1.getWidth() > obj2.getX() &&
            obj1.getY() < obj2.getY() + obj2.getHeight() &&
            obj1.getY() + obj1.getHeight() > obj2.getY();
    }
    // Public methods for objects to access
    addBullet(bullet) {
        this.bullets.push(bullet);
    }
    addBomb(bomb) {
        this.bombs.push(bomb);
    }
    addEnemyBullet(bullet) {
        this.enemyBullets.push(bullet);
    }
    getKeys() {
        return this.keys;
    }
    gameOver() {
        console.log("Game Over! Final Score:", this.score);
        this.gameState = 'title';
        this.titleTimer = 0;
        this.audioSystem.resetTitleMusic();
        this.player.reset(100, this.height / 2);
    }
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.gameState === 'title') {
            this.renderSystem.drawTitleScreen();
            return;
        }
        // Save context and apply camera transform
        this.ctx.save();
        this.ctx.translate(-this.cameraX, -this.cameraY);
        this.renderSystem.drawBackground(this.cameraX);
        this.renderSystem.drawTerrain(this.cameraX, this.terrain, (x) => this.getTerrainHeightAt(x));
        this.player.render(this.ctx);
        this.bullets.forEach(bullet => bullet.render(this.ctx));
        this.bombs.forEach(bomb => bomb.render(this.ctx));
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        this.enemyBullets.forEach(bullet => bullet.render(this.ctx));
        this.birds.forEach(bird => bird.render(this.ctx));
        // Restore context for UI
        this.ctx.restore();
        this.renderSystem.drawUI(this.player, this.score, (x) => this.getTerrainHeightAt(x));
    }
    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        this.update(deltaTime);
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    start() {
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}
//# sourceMappingURL=Game.js.map