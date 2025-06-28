class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.keys = {};
        this.lastTime = 0;
        
        this.setupEventListeners();
        this.init();
    }
    
    init() {
        this.player = new Player(this);
        this.bullets = [];
        this.bombs = [];
        this.enemies = [];
        this.scrollOffset = 0;
        this.score = 0;
        
        this.spawnEnemies();
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    spawnEnemies() {
        for (let i = 0; i < 3; i++) {
            this.enemies.push(new Enemy(this, this.width + i * 300, Math.random() * (this.height - 200) + 100));
        }
    }
    
    update(deltaTime) {
        this.scrollOffset += 50 * deltaTime;
        
        this.player.update(deltaTime);
        
        this.bullets.forEach((bullet, index) => {
            bullet.update(deltaTime);
            if (bullet.x > this.width || bullet.x < 0 || bullet.y > this.height || bullet.y < 0) {
                this.bullets.splice(index, 1);
            }
        });
        
        this.bombs.forEach((bomb, index) => {
            bomb.update(deltaTime);
            if (bomb.y > this.height) {
                this.bombs.splice(index, 1);
            }
        });
        
        this.enemies.forEach((enemy, index) => {
            enemy.update(deltaTime);
            if (enemy.x < -100) {
                this.enemies.splice(index, 1);
                this.enemies.push(new Enemy(this, this.width + 200, Math.random() * (this.height - 200) + 100));
            }
        });
        
        this.checkCollisions();
    }
    
    checkCollisions() {
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isColliding(bullet, enemy)) {
                    this.bullets.splice(bulletIndex, 1);
                    this.enemies.splice(enemyIndex, 1);
                    this.score += 100;
                    this.enemies.push(new Enemy(this, this.width + 200, Math.random() * (this.height - 200) + 100));
                }
            });
        });
        
        this.bombs.forEach((bomb, bombIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isColliding(bomb, enemy)) {
                    this.bombs.splice(bombIndex, 1);
                    this.enemies.splice(enemyIndex, 1);
                    this.score += 150;
                    this.enemies.push(new Enemy(this, this.width + 200, Math.random() * (this.height - 200) + 100));
                }
            });
        });
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBackground();
        
        this.player.render();
        this.bullets.forEach(bullet => bullet.render());
        this.bombs.forEach(bomb => bomb.render());
        this.enemies.forEach(enemy => enemy.render());
        
        this.drawUI();
    }
    
    drawBackground() {
        const cloudOffset = this.scrollOffset * 0.3;
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) {
            const x = (i * 200 - cloudOffset) % (this.width + 100);
            const y = 50 + Math.sin(i) * 30;
            this.drawCloud(x, y);
        }
    }
    
    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y, 30, 0, Math.PI * 2);
        this.ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawUI() {
        this.ctx.fillStyle = '#333';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
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

class Player {
    constructor(game) {
        this.game = game;
        this.x = 100;
        this.y = game.height / 2;
        this.width = 60;
        this.height = 30;
        this.speed = 200;
        this.lastShot = 0;
        this.lastBomb = 0;
    }
    
    update(deltaTime) {
        if (this.game.keys['ArrowUp'] && this.y > 0) {
            this.y -= this.speed * deltaTime;
        }
        if (this.game.keys['ArrowDown'] && this.y < this.game.height - this.height) {
            this.y += this.speed * deltaTime;
        }
        if (this.game.keys['ArrowLeft'] && this.x > 0) {
            this.x -= this.speed * deltaTime;
        }
        if (this.game.keys['ArrowRight'] && this.x < this.game.width - this.width) {
            this.x += this.speed * deltaTime;
        }
        
        if (this.game.keys[' '] && Date.now() - this.lastShot > 200) {
            this.shoot();
            this.lastShot = Date.now();
        }
        
        if (this.game.keys['b'] && Date.now() - this.lastBomb > 500) {
            this.dropBomb();
            this.lastBomb = Date.now();
        }
    }
    
    shoot() {
        this.game.bullets.push(new Bullet(this.game, this.x + this.width, this.y + this.height / 2, 400, 0));
    }
    
    dropBomb() {
        this.game.bombs.push(new Bomb(this.game, this.x + this.width / 2, this.y + this.height));
    }
    
    render() {
        const ctx = this.game.ctx;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y + 10, this.width, 10);
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y + this.height / 2);
        ctx.lineTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y + 20, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Enemy {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 25;
        this.speed = 100;
        this.direction = Math.random() > 0.5 ? 1 : -1;
    }
    
    update(deltaTime) {
        this.x -= this.speed * deltaTime;
        this.y += this.direction * 30 * deltaTime;
        
        if (this.y <= 0 || this.y >= this.game.height - this.height) {
            this.direction *= -1;
        }
    }
    
    render() {
        const ctx = this.game.ctx;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y + 8, this.width, 8);
        
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }
}

class Bullet {
    constructor(game, x, y, speedX, speedY) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.width = 5;
        this.height = 2;
    }
    
    update(deltaTime) {
        this.x += this.speedX * deltaTime;
        this.y += this.speedY * deltaTime;
    }
    
    render() {
        this.game.ctx.fillStyle = '#FFFF00';
        this.game.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Bomb {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.speedY = 200;
        this.width = 8;
        this.height = 12;
    }
    
    update(deltaTime) {
        this.y += this.speedY * deltaTime;
    }
    
    render() {
        this.game.ctx.fillStyle = '#333';
        this.game.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

const game = new Game();
game.start();