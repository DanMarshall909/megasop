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
    
    renderSVGPath(pathData, fillColor, scale = 1, offsetX = 0, offsetY = 0) {
        this.ctx.save();
        this.ctx.scale(scale, scale);
        this.ctx.translate(offsetX, offsetY);
        this.ctx.fillStyle = fillColor;
        
        const path = new Path2D(pathData);
        this.ctx.fill(path);
        
        this.ctx.restore();
    }
    
    init() {
        this.player = new Player(this);
        this.bullets = [];
        this.bombs = [];
        this.enemies = [];
        this.scrollOffset = 0;
        this.score = 0;
        this.cameraX = 0;
        this.cameraY = 0;
        
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
            const spawnX = this.cameraX + this.width + i * 300;
            const spawnY = Math.random() * (this.height - 200) + 100;
            this.enemies.push(new Enemy(this, spawnX, spawnY));
        }
    }
    
    update(deltaTime) {
        this.scrollOffset += 50 * deltaTime;
        
        this.player.update(deltaTime);
        
        // Update camera to follow player
        this.cameraX = this.player.x - this.width / 2;
        this.cameraY = this.player.y - this.height / 2;
        
        this.bullets.forEach((bullet, index) => {
            bullet.update(deltaTime);
            if (bullet.x > this.cameraX + this.width + 100 || bullet.x < this.cameraX - 100 || 
                bullet.y > this.cameraY + this.height + 100 || bullet.y < this.cameraY - 100) {
                this.bullets.splice(index, 1);
            }
        });
        
        this.bombs.forEach((bomb, index) => {
            bomb.update(deltaTime);
            if (bomb.y > this.cameraY + this.height + 100) {
                this.bombs.splice(index, 1);
            }
        });
        
        this.enemies.forEach((enemy, index) => {
            enemy.update(deltaTime);
            if (enemy.x < this.cameraX - 200) {
                this.enemies.splice(index, 1);
                this.enemies.push(new Enemy(this, this.cameraX + this.width + 200, Math.random() * (this.height - 200) + 100));
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
        
        // Save context and apply camera transform
        this.ctx.save();
        this.ctx.translate(-this.cameraX, -this.cameraY);
        
        this.drawBackground();
        
        this.player.render();
        this.bullets.forEach(bullet => bullet.render());
        this.bombs.forEach(bomb => bomb.render());
        this.enemies.forEach(enemy => enemy.render());
        
        // Restore context for UI
        this.ctx.restore();
        
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
        
        // Power indicator
        this.ctx.fillText(`Power: ${Math.round(this.player.power * 100)}%`, 10, 60);
        
        // Power bar
        this.ctx.strokeStyle = '#333';
        this.ctx.strokeRect(10, 70, 200, 20);
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(10, 70, 200 * this.player.power, 20);
        
        // Pitch indicator
        const pitchDegrees = Math.round(this.player.pitch * 180 / Math.PI);
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(`Pitch: ${pitchDegrees}°`, 10, 120);
        
        // Speed indicator
        const speed = Math.sqrt(this.player.velocityX * this.player.velocityX + this.player.velocityY * this.player.velocityY);
        this.ctx.fillText(`Speed: ${Math.round(speed)}`, 10, 150);
        
        // Stall warning
        if (speed < this.player.stallSpeed) {
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillText('STALL!', 10, 180);
        }
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
        this.pitch = 0; // Pitch angle in radians
        this.power = 0.5; // Power level 0-1
        this.maxPower = 1.0;
        this.velocityX = 100; // Start with forward momentum
        this.velocityY = 0;
        this.maxSpeed = 400;
        this.stallSpeed = 80; // Minimum speed to maintain lift
        this.liftCoefficient = 0.8;
        this.dragCoefficient = 0.02;
    }
    
    update(deltaTime) {
        // Pitch controls
        if (this.game.keys['ArrowUp']) {
            this.pitch = Math.max(this.pitch - 2 * deltaTime, -Math.PI / 3); // Max 60 degrees up
        }
        if (this.game.keys['ArrowDown']) {
            this.pitch = Math.min(this.pitch + 2 * deltaTime, Math.PI / 3); // Max 60 degrees down
        }
        
        // Power controls
        if (this.game.keys['ArrowRight']) {
            this.power = Math.min(this.power + deltaTime, this.maxPower);
        }
        if (this.game.keys['ArrowLeft']) {
            this.power = Math.max(this.power - deltaTime, 0);
        }
        
        // Calculate current speed and angle of attack
        const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        const flightAngle = Math.atan2(this.velocityY, this.velocityX);
        const angleOfAttack = this.pitch - flightAngle;
        
        // Thrust from propeller
        const thrust = this.power * 500;
        const thrustX = Math.cos(this.pitch) * thrust * deltaTime;
        const thrustY = Math.sin(this.pitch) * thrust * deltaTime;
        
        // Lift force (perpendicular to flight direction, depends on speed and angle of attack)
        let liftForce = 0;
        if (currentSpeed > 0) {
            liftForce = this.liftCoefficient * currentSpeed * Math.sin(angleOfAttack) * deltaTime;
            // Stall if angle of attack is too steep or speed too low
            if (Math.abs(angleOfAttack) > Math.PI / 3 || currentSpeed < this.stallSpeed) {
                liftForce *= 0.3; // Dramatically reduce lift when stalling
            }
        }
        
        // Apply lift perpendicular to flight direction
        const liftX = -Math.sin(flightAngle) * liftForce;
        const liftY = Math.cos(flightAngle) * liftForce;
        
        // Drag force (opposite to flight direction)
        const dragForce = this.dragCoefficient * currentSpeed * currentSpeed * deltaTime;
        const dragX = -Math.cos(flightAngle) * dragForce;
        const dragY = -Math.sin(flightAngle) * dragForce;
        
        // Apply all forces
        this.velocityX += thrustX + liftX + dragX;
        this.velocityY += thrustY + liftY + dragY;
        
        // Gravity
        this.velocityY += 150 * deltaTime;
        
        // Limit maximum speed
        const newSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (newSpeed > this.maxSpeed) {
            this.velocityX = (this.velocityX / newSpeed) * this.maxSpeed;
            this.velocityY = (this.velocityY / newSpeed) * this.maxSpeed;
        }
        
        // Update position
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Boundary checking
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = Math.max(0, this.velocityX);
        }
        if (this.x > this.game.width - this.width) {
            this.x = this.game.width - this.width;
            this.velocityX = Math.min(0, this.velocityX);
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = Math.max(0, this.velocityY);
        }
        if (this.y > this.game.height - this.height) {
            this.y = this.game.height - this.height;
            this.velocityY = Math.min(0, this.velocityY);
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
        // Calculate bullet velocity based on plane's pitch
        const bulletSpeed = 600;
        const bulletVelX = Math.cos(this.pitch) * bulletSpeed;
        const bulletVelY = Math.sin(this.pitch) * bulletSpeed;
        
        // Fire from the front of the plane
        const fireX = this.x + this.width / 2 + Math.cos(this.pitch) * 30;
        const fireY = this.y + this.height / 2 + Math.sin(this.pitch) * 30;
        
        this.game.bullets.push(new Bullet(this.game, fireX, fireY, bulletVelX, bulletVelY));
    }
    
    dropBomb() {
        this.game.bombs.push(new Bomb(this.game, this.x + this.width / 2, this.y + this.height));
    }
    
    render() {
        const ctx = this.game.ctx;
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.pitch);
        ctx.scale(-1, -1); // Flip both horizontally and vertically
        
        // SVG biplane path data
        const planePath = "M3000 6159 c-173 -18 -343 -79 -422 -152 -45 -41 -63 -113 -61 -247 2 -158 72 -325 194 -464 l43 -49 2 -216 c6 -619 6 -753 1 -758 -4 -3 -145 0 -314 7 -336 13 -1388 6 -1549 -10 -206 -22 -381 -112 -595 -309 -48 -45 -89 -81 -91 -81 -6 0 10 546 21 715 6 94 18 216 27 271 17 114 10 170 -29 211 -24 27 -38 19 -68 -39 -26 -51 -44 -136 -66 -303 -15 -117 -18 -217 -18 -611 0 -335 -3 -475 -11 -485 -31 -38 -56 -106 -61 -167 -4 -52 2 -102 27 -222 43 -210 45 -260 21 -522 -34 -371 -26 -1001 19 -1453 5 -55 10 -110 10 -122 0 -61 89 2 111 78 19 67 17 569 -4 814 -29 355 -40 639 -29 768 6 65 13 121 16 124 3 3 27 -12 53 -35 140 -117 415 -269 658 -365 322 -127 566 -196 1220 -347 171 -40 312 -74 314 -76 2 -2 -21 -31 -52 -63 -54 -56 -57 -62 -57 -110 0 -48 2 -53 60 -110 l60 -59 -32 -52 c-27 -43 -33 -65 -36 -123 -4 -67 -7 -74 -55 -136 -102 -133 -151 -275 -151 -436 0 -121 21 -209 75 -320 101 -210 284 -366 509 -436 108 -34 294 -34 395 0 107 35 169 68 257 133 229 173 341 429 316 719 -9 97 -12 104 -82 203 -89 126 -57 230 94 306 183 93 412 106 1231 74 385 -15 716 -14 929 5 l75 6 -3 35 c-5 69 -24 100 -113 189 -49 49 -89 93 -89 98 0 5 60 19 133 32 1170 205 2323 435 4012 800 281 61 515 111 520 111 6 0 18 -12 28 -28 58 -90 91 -127 127 -143 22 -10 76 -45 120 -79 44 -34 105 -73 135 -86 73 -34 200 -59 247 -50 52 10 96 49 104 93 6 32 3 39 -21 59 -33 26 -72 38 -191 58 -172 30 -305 88 -343 150 -31 49 -27 64 18 76 75 20 228 50 466 90 402 69 840 162 1021 218 l89 28 3 37 c2 27 -4 51 -22 82 -48 81 -41 89 89 100 273 23 424 69 491 148 l25 30 -31 13 c-59 25 -179 44 -376 59 -193 15 -249 21 -288 32 -18 5 -19 13 -13 137 4 72 18 289 32 481 28 368 37 823 22 986 l-9 87 -66 30 c-94 43 -172 62 -282 69 -312 19 -668 -130 -1005 -419 -172 -148 -192 -179 -270 -414 -66 -201 -93 -251 -232 -422 -57 -70 -141 -174 -185 -232 -100 -128 -170 -203 -216 -232 -28 -17 -44 -20 -96 -15 -34 3 -95 15 -136 26 -82 23 -384 68 -660 100 -374 43 -717 65 -1182 77 l-278 7 -49 -50 c-90 -91 -217 -134 -395 -134 -108 1 -188 11 -253 32 -31 10 -35 17 -64 112 -17 56 -38 114 -47 130 l-16 27 -603 0 -603 0 1 434 0 434 154 88 c293 166 411 278 475 453 l18 49 -28 34 c-68 82 -239 127 -745 197 -519 72 -605 81 -1003 111 -357 27 -464 39 -808 85 -134 18 -360 35 -429 34 -27 -1 -88 -6 -135 -10z m2419 -1416 c1 -260 -9 -476 -21 -488 -2 -2 -82 1 -179 6 -109 6 -232 6 -325 0 -82 -5 -151 -7 -154 -4 -9 9 -12 208 -5 379 l7 170 161 53 c216 70 402 138 457 167 25 13 48 23 52 24 4 0 7 -138 7 -307z m-2002 157 c43 -6 128 -20 188 -31 61 -12 153 -26 205 -33 l95 -12 -100 -75 c-127 -96 -251 -179 -266 -179 -23 0 -114 79 -242 210 l-127 130 84 0 c47 0 120 -5 163 -10z m783 -170 c-17 -41 -79 -166 -138 -277 l-107 -203 -55 0 c-76 0 -123 29 -179 109 l-45 64 40 35 c46 41 377 320 408 344 25 19 100 28 104 13 1 -6 -11 -44 -28 -85z m153 -220 l-1 -244 -33 -9 c-40 -11 -220 -3 -243 10 -14 7 -1 38 83 205 88 172 130 262 155 333 7 18 9 16 24 -15 14 -30 17 -70 15 -280z m-362 271 c-28 -52 -219 -205 -346 -276 l-50 -28 43 45 c24 25 78 71 120 102 42 31 113 83 157 115 44 33 81 60 83 60 1 1 -2 -7 -7 -18z m-593 -186 c31 -26 57 -76 50 -97 -6 -16 -52 32 -85 86 -27 44 -10 49 35 11z m-195 -27 c23 -17 88 -178 81 -200 -3 -9 -23 -32 -46 -49 -39 -31 -41 -32 -54 -14 -15 21 -21 275 -6 275 5 0 16 -6 25 -12z m135 -68 c24 -36 29 -64 10 -58 -12 4 -55 73 -57 91 -2 18 25 -1 47 -33z m202 -83 c0 -25 -17 -47 -37 -47 -8 0 -13 13 -13 35 0 31 3 35 25 35 19 0 25 -5 25 -23z m6875 -31 c-4 -17 -10 -138 -14 -268 -4 -130 -10 -240 -13 -244 -13 -13 -328 20 -386 41 -9 3 8 29 47 75 33 38 115 143 182 232 147 197 157 208 176 201 11 -4 13 -14 8 -37z m-6990 -39 c0 -26 -20 -25 -23 2 -3 16 1 22 10 19 7 -3 13 -12 13 -21z m218 -2 c20 -14 37 -27 37 -28 0 -1 4 -17 10 -36 l9 -33 -56 4 c-59 5 -83 23 -83 62 0 17 26 54 40 55 3 1 22 -10 43 -24z m-283 -66 c7 -11 10 -23 7 -25 -3 -3 -29 -4 -58 -2 l-54 3 23 23 c28 28 68 29 82 1z";
        
        // Scale down the SVG to fit the game (original is very large)
        const scale = 0.01;
        // Center the SVG around the origin (red dot) - need much larger offsets
        const offsetX = -3000; // Move left to center horizontally (SVG is ~6000 wide)
        const offsetY = -3000; // Move up to center vertically (SVG is ~6000 tall)
        
        this.game.renderSVGPath(planePath, '#4A90E2', scale, offsetX, offsetY);
        
        ctx.restore();
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
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(1, -1); // Flip only vertically (enemy faces right, upside down)
        
        // Same SVG biplane path as player
        const planePath = "M3000 6159 c-173 -18 -343 -79 -422 -152 -45 -41 -63 -113 -61 -247 2 -158 72 -325 194 -464 l43 -49 2 -216 c6 -619 6 -753 1 -758 -4 -3 -145 0 -314 7 -336 13 -1388 6 -1549 -10 -206 -22 -381 -112 -595 -309 -48 -45 -89 -81 -91 -81 -6 0 10 546 21 715 6 94 18 216 27 271 17 114 10 170 -29 211 -24 27 -38 19 -68 -39 -26 -51 -44 -136 -66 -303 -15 -117 -18 -217 -18 -611 0 -335 -3 -475 -11 -485 -31 -38 -56 -106 -61 -167 -4 -52 2 -102 27 -222 43 -210 45 -260 21 -522 -34 -371 -26 -1001 19 -1453 5 -55 10 -110 10 -122 0 -61 89 2 111 78 19 67 17 569 -4 814 -29 355 -40 639 -29 768 6 65 13 121 16 124 3 3 27 -12 53 -35 140 -117 415 -269 658 -365 322 -127 566 -196 1220 -347 171 -40 312 -74 314 -76 2 -2 -21 -31 -52 -63 -54 -56 -57 -62 -57 -110 0 -48 2 -53 60 -110 l60 -59 -32 -52 c-27 -43 -33 -65 -36 -123 -4 -67 -7 -74 -55 -136 -102 -133 -151 -275 -151 -436 0 -121 21 -209 75 -320 101 -210 284 -366 509 -436 108 -34 294 -34 395 0 107 35 169 68 257 133 229 173 341 429 316 719 -9 97 -12 104 -82 203 -89 126 -57 230 94 306 183 93 412 106 1231 74 385 -15 716 -14 929 5 l75 6 -3 35 c-5 69 -24 100 -113 189 -49 49 -89 93 -89 98 0 5 60 19 133 32 1170 205 2323 435 4012 800 281 61 515 111 520 111 6 0 18 -12 28 -28 58 -90 91 -127 127 -143 22 -10 76 -45 120 -79 44 -34 105 -73 135 -86 73 -34 200 -59 247 -50 52 10 96 49 104 93 6 32 3 39 -21 59 -33 26 -72 38 -191 58 -172 30 -305 88 -343 150 -31 49 -27 64 18 76 75 20 228 50 466 90 402 69 840 162 1021 218 l89 28 3 37 c2 27 -4 51 -22 82 -48 81 -41 89 89 100 273 23 424 69 491 148 l25 30 -31 13 c-59 25 -179 44 -376 59 -193 15 -249 21 -288 32 -18 5 -19 13 -13 137 4 72 18 289 32 481 28 368 37 823 22 986 l-9 87 -66 30 c-94 43 -172 62 -282 69 -312 19 -668 -130 -1005 -419 -172 -148 -192 -179 -270 -414 -66 -201 -93 -251 -232 -422 -57 -70 -141 -174 -185 -232 -100 -128 -170 -203 -216 -232 -28 -17 -44 -20 -96 -15 -34 3 -95 15 -136 26 -82 23 -384 68 -660 100 -374 43 -717 65 -1182 77 l-278 7 -49 -50 c-90 -91 -217 -134 -395 -134 -108 1 -188 11 -253 32 -31 10 -35 17 -64 112 -17 56 -38 114 -47 130 l-16 27 -603 0 -603 0 1 434 0 434 154 88 c293 166 411 278 475 453 l18 49 -28 34 c-68 82 -239 127 -745 197 -519 72 -605 81 -1003 111 -357 27 -464 39 -808 85 -134 18 -360 35 -429 34 -27 -1 -88 -6 -135 -10z m2419 -1416 c1 -260 -9 -476 -21 -488 -2 -2 -82 1 -179 6 -109 6 -232 6 -325 0 -82 -5 -151 -7 -154 -4 -9 9 -12 208 -5 379 l7 170 161 53 c216 70 402 138 457 167 25 13 48 23 52 24 4 0 7 -138 7 -307z m-2002 157 c43 -6 128 -20 188 -31 61 -12 153 -26 205 -33 l95 -12 -100 -75 c-127 -96 -251 -179 -266 -179 -23 0 -114 79 -242 210 l-127 130 84 0 c47 0 120 -5 163 -10z m783 -170 c-17 -41 -79 -166 -138 -277 l-107 -203 -55 0 c-76 0 -123 29 -179 109 l-45 64 40 35 c46 41 377 320 408 344 25 19 100 28 104 13 1 -6 -11 -44 -28 -85z m153 -220 l-1 -244 -33 -9 c-40 -11 -220 -3 -243 10 -14 7 -1 38 83 205 88 172 130 262 155 333 7 18 9 16 24 -15 14 -30 17 -70 15 -280z m-362 271 c-28 -52 -219 -205 -346 -276 l-50 -28 43 45 c24 25 78 71 120 102 42 31 113 83 157 115 44 33 81 60 83 60 1 1 -2 -7 -7 -18z m-593 -186 c31 -26 57 -76 50 -97 -6 -16 -52 32 -85 86 -27 44 -10 49 35 11z m-195 -27 c23 -17 88 -178 81 -200 -3 -9 -23 -32 -46 -49 -39 -31 -41 -32 -54 -14 -15 21 -21 275 -6 275 5 0 16 -6 25 -12z m135 -68 c24 -36 29 -64 10 -58 -12 4 -55 73 -57 91 -2 18 25 -1 47 -33z m202 -83 c0 -25 -17 -47 -37 -47 -8 0 -13 13 -13 35 0 31 3 35 25 35 19 0 25 -5 25 -23z m6875 -31 c-4 -17 -10 -138 -14 -268 -4 -130 -10 -240 -13 -244 -13 -13 -328 20 -386 41 -9 3 8 29 47 75 33 38 115 143 182 232 147 197 157 208 176 201 11 -4 13 -14 8 -37z m-6990 -39 c0 -26 -20 -25 -23 2 -3 16 1 22 10 19 7 -3 13 -12 13 -21z m218 -2 c20 -14 37 -27 37 -28 0 -1 4 -17 10 -36 l9 -33 -56 4 c-59 5 -83 23 -83 62 0 17 26 54 40 55 3 1 22 -10 43 -24z m-283 -66 c7 -11 10 -23 7 -25 -3 -3 -29 -4 -58 -2 l-54 3 23 23 c28 28 68 29 82 1z";
        
        // Scale and position
        const scale = 0.008; // Slightly smaller than player
        // Center the SVG around the origin (red dot) - need much larger offsets
        const offsetX = -3000; // Move left to center horizontally (SVG is ~6000 wide)
        const offsetY = -3000; // Move up to center vertically (SVG is ~6000 tall)
        
        this.game.renderSVGPath(planePath, '#DC143C', scale, offsetX, offsetY);
        
        ctx.restore();
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