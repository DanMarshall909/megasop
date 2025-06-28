import { Bullet } from './Bullet.js';
import { Bomb } from './Bomb.js';
export class Player {
    constructor(game, audioSystem) {
        this.width = 60;
        this.height = 30;
        // Physics properties
        this.velocityX = 100;
        this.velocityY = 0;
        this.pitch = 0;
        this.power = 0.5;
        this.rollRate = 0;
        // Constants
        this.maxPower = 1.0;
        this.maxSpeed = 400;
        this.stallSpeed = 80;
        this.maxRollRate = 3; // ~170 degrees/second
        this.liftCoefficient = 0.8;
        this.dragCoefficient = 0.02;
        // Health and state
        this.health = 100;
        this.maxHealth = 100;
        this.isAlive = true;
        // Weapon timing
        this.lastShot = 0;
        this.lastBomb = 0;
        this.game = game;
        this.audioSystem = audioSystem;
        this.x = 100;
        this.y = game['height'] / 2; // Access private property for initialization
    }
    update(deltaTime) {
        if (!this.isAlive)
            return;
        const keys = this.game.getKeys();
        // Continuous roll controls - like real aircraft
        if (keys['ArrowUp']) {
            // Pull back on stick - increase roll rate
            this.rollRate = Math.min(this.rollRate + 5 * deltaTime, this.maxRollRate);
        }
        else if (keys['ArrowDown']) {
            // Push forward on stick - reverse roll rate
            this.rollRate = Math.max(this.rollRate - 5 * deltaTime, -this.maxRollRate);
        }
        else {
            // Center stick - reduce roll rate toward zero
            if (this.rollRate > 0) {
                this.rollRate = Math.max(this.rollRate - 3 * deltaTime, 0);
            }
            else if (this.rollRate < 0) {
                this.rollRate = Math.min(this.rollRate + 3 * deltaTime, 0);
            }
        }
        // Apply continuous rolling motion
        this.pitch += this.rollRate * deltaTime;
        // Keep pitch in reasonable range (allow unlimited rolling)
        while (this.pitch > Math.PI * 2) {
            this.pitch -= Math.PI * 2;
        }
        while (this.pitch < -Math.PI * 2) {
            this.pitch += Math.PI * 2;
        }
        // Power controls
        if (keys['ArrowRight']) {
            this.power = Math.min(this.power + deltaTime, this.maxPower);
        }
        if (keys['ArrowLeft']) {
            this.power = Math.max(this.power - deltaTime, 0);
        }
        // Physics calculations
        const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        const flightAngle = Math.atan2(this.velocityY, this.velocityX);
        const angleOfAttack = this.pitch - flightAngle;
        // Thrust from propeller
        const thrust = this.power * 500;
        const thrustX = Math.cos(this.pitch) * thrust * deltaTime;
        const thrustY = Math.sin(this.pitch) * thrust * deltaTime;
        // Lift force
        let liftForce = 0;
        if (currentSpeed > 0) {
            liftForce = this.liftCoefficient * currentSpeed * Math.sin(angleOfAttack) * deltaTime;
            if (Math.abs(angleOfAttack) > Math.PI / 3 || currentSpeed < this.stallSpeed) {
                liftForce *= 0.3; // Stall condition
            }
        }
        // Apply lift perpendicular to flight direction
        const liftX = -Math.sin(flightAngle) * liftForce;
        const liftY = Math.cos(flightAngle) * liftForce;
        // Drag force
        const dragForce = this.dragCoefficient * currentSpeed * currentSpeed * deltaTime;
        const dragX = -Math.cos(flightAngle) * dragForce;
        const dragY = -Math.sin(flightAngle) * dragForce;
        // Apply all forces
        this.velocityX += thrustX + liftX + dragX;
        this.velocityY += thrustY + liftY + dragY;
        // Gravity
        this.velocityY += 150 * deltaTime;
        // Speed limiting
        const newSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (newSpeed > this.maxSpeed) {
            this.velocityX = (this.velocityX / newSpeed) * this.maxSpeed;
            this.velocityY = (this.velocityY / newSpeed) * this.maxSpeed;
        }
        // Update position
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        // Terrain collision
        const terrainHeight = this.game.getTerrainHeightAt(this.x + this.width / 2);
        if (this.y + this.height > terrainHeight) {
            this.y = terrainHeight - this.height;
            this.velocityY = Math.min(0, this.velocityY * -0.3);
            this.velocityX *= 0.8;
            // Crash damage
            const impactSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
            if (impactSpeed > 200) {
                const damage = Math.min(50, (impactSpeed - 200) / 4);
                this.takeDamage(damage);
                this.audioSystem.playHitSound();
                console.log("Crashed! Damage:", Math.round(damage));
            }
        }
        // Boundary checking
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = Math.max(0, this.velocityX);
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = Math.max(0, this.velocityY);
        }
        // Weapons
        if (keys[' '] && Date.now() - this.lastShot > 200) {
            this.shoot();
            this.lastShot = Date.now();
        }
        if (keys['b'] && Date.now() - this.lastBomb > 500) {
            this.dropBomb();
            this.lastBomb = Date.now();
        }
    }
    shoot() {
        const bulletSpeed = 600;
        const bulletVelX = Math.cos(this.pitch) * bulletSpeed;
        const bulletVelY = Math.sin(this.pitch) * bulletSpeed;
        const fireX = this.x + this.width / 2 + Math.cos(this.pitch) * 30;
        const fireY = this.y + this.height / 2 + Math.sin(this.pitch) * 30;
        this.game.addBullet(new Bullet(this.game, fireX, fireY, bulletVelX, bulletVelY));
        this.audioSystem.playShootSound();
    }
    dropBomb() {
        this.game.addBomb(new Bomb(this.game, this.x + this.width / 2, this.y + this.height));
        this.audioSystem.playBombSound();
    }
    takeDamage(amount) {
        if (!this.isAlive)
            return;
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.isAlive = false;
            this.game.gameOver();
            console.log("Player destroyed!");
        }
    }
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 100;
        this.velocityY = 0;
        this.pitch = 0;
        this.rollRate = 0;
        this.power = 0.5;
        this.health = this.maxHealth;
        this.isAlive = true;
    }
    render(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.pitch);
        ctx.scale(-1, -1); // Flip both horizontally and vertically
        // SVG biplane path data
        const planePath = "M3000 6159 c-173 -18 -343 -79 -422 -152 -45 -41 -63 -113 -61 -247 2 -158 72 -325 194 -464 l43 -49 2 -216 c6 -619 6 -753 1 -758 -4 -3 -145 0 -314 7 -336 13 -1388 6 -1549 -10 -206 -22 -381 -112 -595 -309 -48 -45 -89 -81 -91 -81 -6 0 10 546 21 715 6 94 18 216 27 271 17 114 10 170 -29 211 -24 27 -38 19 -68 -39 -26 -51 -44 -136 -66 -303 -15 -117 -18 -217 -18 -611 0 -335 -3 -475 -11 -485 -31 -38 -56 -106 -61 -167 -4 -52 2 -102 27 -222 43 -210 45 -260 21 -522 -34 -371 -26 -1001 19 -1453 5 -55 10 -110 10 -122 0 -61 89 2 111 78 19 67 17 569 -4 814 -29 355 -40 639 -29 768 6 65 13 121 16 124 3 3 27 -12 53 -35 140 -117 415 -269 658 -365 322 -127 566 -196 1220 -347 171 -40 312 -74 314 -76 2 -2 -21 -31 -52 -63 -54 -56 -57 -62 -57 -110 0 -48 2 -53 60 -110 l60 -59 -32 -52 c-27 -43 -33 -65 -36 -123 -4 -67 -7 -74 -55 -136 -102 -133 -151 -275 -151 -436 0 -121 21 -209 75 -320 101 -210 284 -366 509 -436 108 -34 294 -34 395 0 107 35 169 68 257 133 229 173 341 429 316 719 -9 97 -12 104 -82 203 -89 126 -57 230 94 306 183 93 412 106 1231 74 385 -15 716 -14 929 5 l75 6 -3 35 c-5 69 -24 100 -113 189 -49 49 -89 93 -89 98 0 5 60 19 133 32 1170 205 2323 435 4012 800 281 61 515 111 520 111 6 0 18 -12 28 -28 58 -90 91 -127 127 -143 22 -10 76 -45 120 -79 44 -34 105 -73 135 -86 73 -34 200 -59 247 -50 52 10 96 49 104 93 6 32 3 39 -21 59 -33 26 -72 38 -191 58 -172 30 -305 88 -343 150 -31 49 -27 64 18 76 75 20 228 50 466 90 402 69 840 162 1021 218 l89 28 3 37 c2 27 -4 51 -22 82 -48 81 -41 89 89 100 273 23 424 69 491 148 l25 30 -31 13 c-59 25 -179 44 -376 59 -193 15 -249 21 -288 32 -18 5 -19 13 -13 137 4 72 18 289 32 481 28 368 37 823 22 986 l-9 87 -66 30 c-94 43 -172 62 -282 69 -312 19 -668 -130 -1005 -419 -172 -148 -192 -179 -270 -414 -66 -201 -93 -251 -232 -422 -57 -70 -141 -174 -185 -232 -100 -128 -170 -203 -216 -232 -28 -17 -44 -20 -96 -15 -34 3 -95 15 -136 26 -82 23 -384 68 -660 100 -374 43 -717 65 -1182 77 l-278 7 -49 -50 c-90 -91 -217 -134 -395 -134 -108 1 -188 11 -253 32 -31 10 -35 17 -64 112 -17 56 -38 114 -47 130 l-16 27 -603 0 -603 0 1 434 0 434 154 88 c293 166 411 278 475 453 l18 49 -28 34 c-68 82 -239 127 -745 197 -519 72 -605 81 -1003 111 -357 27 -464 39 -808 85 -134 18 -360 35 -429 34 -27 -1 -88 -6 -135 -10z m2419 -1416 c1 -260 -9 -476 -21 -488 -2 -2 -82 1 -179 6 -109 6 -232 6 -325 0 -82 -5 -151 -7 -154 -4 -9 9 -12 208 -5 379 l7 170 161 53 c216 70 402 138 457 167 25 13 48 23 52 24 4 0 7 -138 7 -307z m-2002 157 c43 -6 128 -20 188 -31 61 -12 153 -26 205 -33 l95 -12 -100 -75 c-127 -96 -251 -179 -266 -179 -23 0 -114 79 -242 210 l-127 130 84 0 c47 0 120 -5 163 -10z m783 -170 c-17 -41 -79 -166 -138 -277 l-107 -203 -55 0 c-76 0 -123 29 -179 109 l-45 64 40 35 c46 41 377 320 408 344 25 19 100 28 104 13 1 -6 -11 -44 -28 -85z m153 -220 l-1 -244 -33 -9 c-40 -11 -220 -3 -243 10 -14 7 -1 38 83 205 88 172 130 262 155 333 7 18 9 16 24 -15 14 -30 17 -70 15 -280z m-362 271 c-28 -52 -219 -205 -346 -276 l-50 -28 43 45 c24 25 78 71 120 102 42 31 113 83 157 115 44 33 81 60 83 60 1 1 -2 -7 -7 -18z m-593 -186 c31 -26 57 -76 50 -97 -6 -16 -52 32 -85 86 -27 44 -10 49 35 11z m-195 -27 c23 -17 88 -178 81 -200 -3 -9 -23 -32 -46 -49 -39 -31 -41 -32 -54 -14 -15 21 -21 275 -6 275 5 0 16 -6 25 -12z m135 -68 c24 -36 29 -64 10 -58 -12 4 -55 73 -57 91 -2 18 25 -1 47 -33z m202 -83 c0 -25 -17 -47 -37 -47 -8 0 -13 13 -13 35 0 31 3 35 25 35 19 0 25 -5 25 -23z m6875 -31 c-4 -17 -10 -138 -14 -268 -4 -130 -10 -240 -13 -244 -13 -13 -328 20 -386 41 -9 3 8 29 47 75 33 38 115 143 182 232 147 197 157 208 176 201 11 -4 13 -14 8 -37z m-6990 -39 c0 -26 -20 -25 -23 2 -3 16 1 22 10 19 7 -3 13 -12 13 -21z m218 -2 c20 -14 37 -27 37 -28 0 -1 4 -17 10 -36 l9 -33 -56 4 c-59 5 -83 23 -83 62 0 17 26 54 40 55 3 1 22 -10 43 -24z m-283 -66 c7 -11 10 -23 7 -25 -3 -3 -29 -4 -58 -2 l-54 3 23 23 c28 28 68 29 82 1z";
        const scale = 0.01;
        const offsetX = -3000;
        const offsetY = -3000;
        // Render SVG path
        const path = new Path2D(planePath);
        ctx.scale(scale, scale);
        ctx.translate(offsetX, offsetY);
        ctx.fillStyle = '#4A90E2';
        ctx.fill(path);
        ctx.restore();
    }
    // Getters for public access
    getX() { return this.x; }
    getY() { return this.y; }
    getWidth() { return this.width; }
    getHeight() { return this.height; }
    getPower() { return this.power; }
    getPitch() { return this.pitch; }
    getRollRate() { return this.rollRate; }
    getHealth() { return this.health; }
    getMaxHealth() { return this.maxHealth; }
    getVelocityX() { return this.velocityX; }
    getVelocityY() { return this.velocityY; }
    getStallSpeed() { return this.stallSpeed; }
}
//# sourceMappingURL=Player.js.map