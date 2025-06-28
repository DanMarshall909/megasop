class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.keys = {};
        this.lastTime = 0;
        
        this.setupEventListeners();
        this.setupAudio();
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
        this.gameState = 'title'; // title, playing, gameOver
        this.titleTimer = 0;
        this.player = new Player(this);
        this.bullets = [];
        this.bombs = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.birds = [];
        this.scrollOffset = 0;
        this.score = 0;
        this.cameraX = 0;
        this.cameraY = 0;
        this.terrain = this.generateTerrain();
        
        this.spawnEnemies();
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
        } else {
            document.exitFullscreen();
        }
    }
    
    handleFullscreenChange() {
        if (document.fullscreenElement) {
            // Entered fullscreen - resize canvas
            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';
            this.canvas.style.objectFit = 'contain';
        } else {
            // Exited fullscreen - restore original size
            this.canvas.style.width = '';
            this.canvas.style.height = '';
            this.canvas.style.objectFit = '';
        }
    }
    
    setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.soundEnabled = true;
            this.currentSound = null;
            this.soundPriority = 0;
            this.titleMusicPosition = 0;
            this.titleMusicTimer = 0;
            
            // PC Speaker frequency table for authentic sounds
            this.frequencies = {
                'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
                'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
                'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
                'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
                'C6': 1046.50
            };
            
            // Original Sopwith title melody (simplified)
            this.titleMelody = [
                {note: 'G4', duration: 0.3},
                {note: 'C5', duration: 0.3},
                {note: 'E5', duration: 0.3},
                {note: 'G5', duration: 0.6},
                {note: 'F5', duration: 0.3},
                {note: 'E5', duration: 0.3},
                {note: 'D5', duration: 0.3},
                {note: 'C5', duration: 0.6},
                {note: 'G4', duration: 0.3},
                {note: 'C5', duration: 0.3},
                {note: 'E5', duration: 0.3},
                {note: 'C5', duration: 0.6},
                {note: 'rest', duration: 0.6}
            ];
            
        } catch (e) {
            console.log("Web Audio API not supported");
            this.soundEnabled = false;
        }
    }
    
    playSound(frequency, duration, priority = 0, type = 'square', volume = 0.15) {
        if (!this.soundEnabled) return;
        
        // PC Speaker priority system - higher priority interrupts lower
        if (this.currentSound && priority <= this.soundPriority) {
            return; // Don't interrupt higher priority sound
        }
        
        // Stop current sound if new one has higher priority
        if (this.currentSound) {
            this.currentSound.stop();
        }
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type; // Square wave for authentic PC speaker sound
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
            this.currentSound = oscillator;
            this.soundPriority = priority;
            
            // Clear current sound when it ends
            setTimeout(() => {
                if (this.currentSound === oscillator) {
                    this.currentSound = null;
                    this.soundPriority = 0;
                }
            }, duration * 1000);
            
        } catch (e) {
            console.log("Sound playback failed");
        }
    }
    
    playEngineSound() {
        // Priority 60 - Plane sound (continuous, low priority)
        const baseFreq = 100 + this.player.power * 50;
        this.playSound(baseFreq, 0.15, 60, 'square', 0.08);
    }
    
    playShootSound() {
        // Priority 30 - Shot sound (quick, sharp)
        this.playSound(1000, 0.08, 30, 'square', 0.12);
    }
    
    playBombSound() {
        // Priority 20 - Bomb sound (descending tone)
        this.playSound(400, 0.25, 20, 'square', 0.15);
    }
    
    playExplosionSound() {
        // Priority 10 - Explosion sound (noise burst with multiple tones)
        this.playSound(200, 0.3, 10, 'square', 0.2);
        setTimeout(() => this.playSound(150, 0.2, 10, 'square', 0.15), 100);
        setTimeout(() => this.playSound(100, 0.15, 10, 'square', 0.1), 200);
    }
    
    playHitSound() {
        // Priority 50 - Hit sound (sharp ping)
        this.playSound(1500, 0.1, 50, 'square', 0.18);
    }
    
    playTitleMusic() {
        // Priority 5 - Title screen music (lowest priority)
        if (this.titleMusicPosition >= this.titleMelody.length) {
            this.titleMusicPosition = 0; // Loop the melody
        }
        
        const note = this.titleMelody[this.titleMusicPosition];
        if (note.note !== 'rest') {
            const frequency = this.frequencies[note.note];
            this.playSound(frequency, note.duration, 5, 'square', 0.1);
        }
        
        this.titleMusicPosition++;
        this.titleMusicTimer = note.duration;
    }
    
    updateTitleMusic(deltaTime) {
        if (this.titleMusicTimer > 0) {
            this.titleMusicTimer -= deltaTime;
        } else {
            this.playTitleMusic();
        }
    }
    
    generateTerrain() {
        const terrain = [];
        const terrainLength = 10000; // Length of terrain
        const baseHeight = this.height - 100; // Base ground level
        
        // Generate terrain using sine waves for hills and valleys
        for (let x = 0; x < terrainLength; x += 20) {
            // Combine multiple sine waves for varied terrain
            const height1 = Math.sin(x * 0.005) * 80;
            const height2 = Math.sin(x * 0.01) * 40;
            const height3 = Math.sin(x * 0.02) * 20;
            
            const terrainHeight = baseHeight + height1 + height2 + height3;
            terrain.push({ x: x, y: terrainHeight });
        }
        
        return terrain;
    }
    
    getTerrainHeightAt(x) {
        // Find the terrain height at a specific x coordinate
        for (let i = 0; i < this.terrain.length - 1; i++) {
            if (x >= this.terrain[i].x && x <= this.terrain[i + 1].x) {
                // Linear interpolation between two terrain points
                const t = (x - this.terrain[i].x) / (this.terrain[i + 1].x - this.terrain[i].x);
                return this.terrain[i].y + t * (this.terrain[i + 1].y - this.terrain[i].y);
            }
        }
        // Default to base height if outside terrain bounds
        return this.height - 100;
    }
    
    spawnEnemies() {
        for (let i = 0; i < 3; i++) {
            const spawnX = this.cameraX + this.width + i * 300;
            const spawnY = Math.random() * (this.height - 200) + 100;
            this.enemies.push(new Enemy(this, spawnX, spawnY));
        }
    }
    
    spawnBirds() {
        // Spawn birds randomly across the sky
        for (let i = 0; i < 5; i++) {
            const spawnX = this.cameraX + this.width + Math.random() * 500;
            const spawnY = Math.random() * (this.height - 300) + 50;
            this.birds.push(new Bird(this, spawnX, spawnY));
        }
    }
    
    update(deltaTime) {
        if (this.gameState === 'title') {
            this.updateTitleMusic(deltaTime);
            this.titleTimer += deltaTime;
            
            // Start game on any key press
            if (Object.values(this.keys).some(key => key)) {
                this.gameState = 'playing';
                this.titleMusicPosition = 0;
                this.titleMusicTimer = 0;
                
                // Reset game state
                this.score = 0;
                this.player.x = 100;
                this.player.y = this.height / 2;
                this.player.velocityX = 100;
                this.player.velocityY = 0;
                this.player.health = this.player.maxHealth;
                this.player.isAlive = true;
                
                // Clear arrays and respawn enemies
                this.bullets = [];
                this.bombs = [];
                this.enemyBullets = [];
                this.enemies = [];
                this.birds = [];
                this.spawnEnemies();
                this.spawnBirds();
            }
            return;
        }
        
        if (this.gameState !== 'playing') return;
        
        this.scrollOffset += 50 * deltaTime;
        
        this.player.update(deltaTime);
        
        // Play engine sound occasionally for ambience
        if (Math.random() < 0.02) {
            this.playEngineSound();
        }
        
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
        
        this.enemyBullets.forEach((bullet, index) => {
            bullet.update(deltaTime);
            if (bullet.x > this.cameraX + this.width + 100 || bullet.x < this.cameraX - 100 || 
                bullet.y > this.cameraY + this.height + 100 || bullet.y < this.cameraY - 100) {
                this.enemyBullets.splice(index, 1);
            }
        });
        
        this.birds.forEach((bird, index) => {
            bird.update(deltaTime);
            if (bird.x < this.cameraX - 200) {
                this.birds.splice(index, 1);
                // Spawn new bird on the right
                const spawnX = this.cameraX + this.width + Math.random() * 200;
                const spawnY = Math.random() * (this.height - 300) + 50;
                this.birds.push(new Bird(this, spawnX, spawnY));
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
                    this.playExplosionSound();
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
                    this.playExplosionSound();
                    this.enemies.push(new Enemy(this, this.width + 200, Math.random() * (this.height - 200) + 100));
                }
            });
        });
        
        // Enemy bullets hitting player
        this.enemyBullets.forEach((bullet, bulletIndex) => {
            if (this.isColliding(bullet, this.player)) {
                this.enemyBullets.splice(bulletIndex, 1);
                this.player.takeDamage(15);
                this.playHitSound();
            }
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
        
        if (this.gameState === 'title') {
            this.drawTitleScreen();
            return;
        }
        
        // Save context and apply camera transform
        this.ctx.save();
        this.ctx.translate(-this.cameraX, -this.cameraY);
        
        this.drawBackground();
        this.drawTerrain();
        
        this.player.render();
        this.bullets.forEach(bullet => bullet.render());
        this.bombs.forEach(bomb => bomb.render());
        this.enemies.forEach(enemy => enemy.render());
        this.enemyBullets.forEach(bullet => bullet.render());
        this.birds.forEach(bird => bird.render());
        
        // Restore context for UI
        this.ctx.restore();
        
        this.drawUI();
    }
    
    drawBackground() {
        // Multiple cloud layers for parallax effect
        this.ctx.fillStyle = '#ffffff';
        
        // Far clouds (slowest)
        const farCloudOffset = this.cameraX * 0.1;
        for (let i = 0; i < 8; i++) {
            const x = (i * 300 - farCloudOffset) % (this.width + 200) + this.cameraX - 100;
            const y = 30 + Math.sin(i * 0.5) * 20;
            this.ctx.globalAlpha = 0.4;
            this.drawCloud(x, y, 0.8);
        }
        
        // Medium clouds
        const medCloudOffset = this.cameraX * 0.3;
        for (let i = 0; i < 6; i++) {
            const x = (i * 250 - medCloudOffset) % (this.width + 150) + this.cameraX - 75;
            const y = 80 + Math.sin(i * 0.7) * 25;
            this.ctx.globalAlpha = 0.6;
            this.drawCloud(x, y, 1.0);
        }
        
        // Near clouds (fastest)
        const nearCloudOffset = this.cameraX * 0.6;
        for (let i = 0; i < 4; i++) {
            const x = (i * 200 - nearCloudOffset) % (this.width + 100) + this.cameraX - 50;
            const y = 120 + Math.sin(i) * 30;
            this.ctx.globalAlpha = 0.8;
            this.drawCloud(x, y, 1.2);
        }
        
        this.ctx.globalAlpha = 1.0; // Reset alpha
    }
    
    drawCloud(x, y, scale = 1.0) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 25 * scale, y, 30 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 50 * scale, y, 20 * scale, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawTerrain() {
        this.ctx.fillStyle = '#8B4513'; // Brown terrain
        this.ctx.strokeStyle = '#654321'; // Darker brown outline
        this.ctx.lineWidth = 2;
        
        // Only draw terrain visible on screen
        const startX = Math.max(0, this.cameraX - 100);
        const endX = this.cameraX + this.width + 100;
        
        this.ctx.beginPath();
        
        // Start from bottom of screen
        this.ctx.moveTo(startX, this.height);
        
        // Draw terrain curve
        for (let x = startX; x <= endX; x += 20) {
            const terrainHeight = this.getTerrainHeightAt(x);
            this.ctx.lineTo(x, terrainHeight);
        }
        
        // Close the shape at bottom right
        this.ctx.lineTo(endX, this.height);
        this.ctx.closePath();
        
        // Fill and stroke
        this.ctx.fill();
        this.ctx.stroke();
        
        // Add some grass on top
        this.ctx.fillStyle = '#228B22'; // Forest green
        this.ctx.beginPath();
        this.ctx.moveTo(startX, this.getTerrainHeightAt(startX));
        
        for (let x = startX; x <= endX; x += 20) {
            const terrainHeight = this.getTerrainHeightAt(x);
            this.ctx.lineTo(x, terrainHeight);
        }
        
        // Add grass layer (10 pixels thick)
        for (let x = endX; x >= startX; x -= 20) {
            const terrainHeight = this.getTerrainHeightAt(x);
            this.ctx.lineTo(x, terrainHeight - 10);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawTitleScreen() {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98D982');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Title
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 72px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SOPWITH', this.width / 2, 150);
        
        // Subtitle
        this.ctx.font = '24px Arial';
        this.ctx.fillText('MegaSop Edition', this.width / 2, 190);
        
        // Instructions
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Press any key to start', this.width / 2, 350);
        
        // Controls
        this.ctx.font = '14px Arial';
        this.ctx.fillText('↑↓: Roll/Pitch (Hold for continuous rolls) | ←→: Power Down/Up', this.width / 2, 420);
        this.ctx.fillText('Space: Machine Gun | B: Drop Bomb | F: Fullscreen', this.width / 2, 445);
        
        // Credits
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.fillText('Original by BMB Compuscience', this.width / 2, 520);
        this.ctx.fillText('Faithful recreation with authentic PC speaker music', this.width / 2, 540);
        
        // Reset text alignment
        this.ctx.textAlign = 'left';
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
        
        // Roll rate indicator
        const rollRateDPS = Math.round(this.player.rollRate * 180 / Math.PI);
        this.ctx.fillText(`Roll Rate: ${rollRateDPS}°/s`, 10, 180);
        
        // Stall warning
        if (speed < this.player.stallSpeed) {
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillText('STALL!', 10, 210);
        }
        
        // Altitude indicator
        const groundLevel = this.getTerrainHeightAt(this.player.x + this.player.width / 2);
        const altitude = Math.max(0, Math.round(groundLevel - (this.player.y + this.player.height)));
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(`Altitude: ${altitude}ft`, 10, 240);
        
        // Health indicator
        this.ctx.fillText(`Health: ${Math.round(this.player.health)}%`, 10, 270);
        
        // Health bar
        const barWidth = 100;
        const barHeight = 10;
        this.ctx.strokeStyle = '#333';
        this.ctx.strokeRect(10, 280, barWidth, barHeight);
        
        const healthPercent = this.player.health / this.player.maxHealth;
        this.ctx.fillStyle = healthPercent > 0.5 ? '#00FF00' : healthPercent > 0.25 ? '#FFFF00' : '#FF0000';
        this.ctx.fillRect(10, 280, barWidth * healthPercent, barHeight);
    }
    
    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    gameOver() {
        console.log("Game Over! Final Score:", this.score);
        this.gameState = 'title';
        this.titleTimer = 0;
        this.titleMusicPosition = 0;
        this.titleMusicTimer = 0;
        // Reset player health for next game
        this.player.health = this.player.maxHealth;
        this.player.isAlive = true;
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
        this.health = 100;
        this.maxHealth = 100;
        this.isAlive = true;
        this.rollRate = 0; // Current roll rate in radians per second
        this.maxRollRate = 3; // Maximum roll rate (about 170 degrees/sec)
    }
    
    update(deltaTime) {
        // Continuous roll controls - like real aircraft
        if (this.game.keys['ArrowUp']) {
            // Pull back on stick - pitch up and increase roll rate
            this.rollRate = Math.min(this.rollRate + 5 * deltaTime, this.maxRollRate);
        } else if (this.game.keys['ArrowDown']) {
            // Push forward on stick - pitch down and reverse roll rate
            this.rollRate = Math.max(this.rollRate - 5 * deltaTime, -this.maxRollRate);
        } else {
            // Center stick - reduce roll rate toward zero
            if (this.rollRate > 0) {
                this.rollRate = Math.max(this.rollRate - 3 * deltaTime, 0);
            } else if (this.rollRate < 0) {
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
        
        // Terrain collision detection
        const terrainHeight = this.game.getTerrainHeightAt(this.x + this.width / 2);
        if (this.y + this.height > terrainHeight) {
            // Crashed into ground
            this.y = terrainHeight - this.height;
            this.velocityY = Math.min(0, this.velocityY * -0.3); // Bounce with energy loss
            this.velocityX *= 0.8; // Friction on ground
            
            // Damage from hard impacts
            const impactSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
            if (impactSpeed > 200) {
                const damage = Math.min(50, (impactSpeed - 200) / 4);
                this.takeDamage(damage);
                this.game.playHitSound();
                console.log("Crashed! Damage:", Math.round(damage));
            }
        }
        
        // Boundary checking (left/right and sky)
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = Math.max(0, this.velocityX);
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = Math.max(0, this.velocityY);
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
        this.game.playShootSound();
    }
    
    dropBomb() {
        this.game.bombs.push(new Bomb(this.game, this.x + this.width / 2, this.y + this.height));
        this.game.playBombSound();
    }
    
    takeDamage(amount) {
        if (!this.isAlive) return;
        
        this.health = Math.max(0, this.health - amount);
        
        if (this.health <= 0) {
            this.isAlive = false;
            this.game.gameOver();
            console.log("Player destroyed!");
        }
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
        this.speed = 150;
        this.pitch = 0;
        this.velocityX = -120; // Start moving left toward player
        this.velocityY = 0;
        this.maxSpeed = 300;
        this.power = 0.7;
        this.aiState = 'patrol'; // patrol, chase, loop, evade
        this.aiTimer = 0;
        this.targetX = x;
        this.targetY = y;
        this.loopStartTime = 0;
        this.lastShot = 0;
    }
    
    update(deltaTime) {
        this.aiTimer += deltaTime;
        
        // AI decision making
        const distToPlayer = Math.sqrt(
            Math.pow(this.game.player.x - this.x, 2) + 
            Math.pow(this.game.player.y - this.y, 2)
        );
        
        // State transitions
        if (distToPlayer < 300 && this.aiState === 'patrol') {
            this.aiState = 'chase';
            this.aiTimer = 0;
        } else if (distToPlayer > 500 && this.aiState === 'chase') {
            this.aiState = 'patrol';
            this.aiTimer = 0;
        } else if (Math.random() < 0.005 && this.aiState !== 'loop') {
            this.aiState = 'loop';
            this.loopStartTime = this.aiTimer;
        }
        
        // AI behavior
        this.executeAI(deltaTime);
        
        // Apply physics (simplified version of player physics)
        const thrust = this.power * 300;
        this.velocityX += Math.cos(this.pitch) * thrust * deltaTime;
        this.velocityY += Math.sin(this.pitch) * thrust * deltaTime;
        
        // Gravity and drag
        this.velocityY += 100 * deltaTime;
        this.velocityX *= 0.99;
        this.velocityY *= 0.99;
        
        // Speed limiting
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (speed > this.maxSpeed) {
            this.velocityX = (this.velocityX / speed) * this.maxSpeed;
            this.velocityY = (this.velocityY / speed) * this.maxSpeed;
        }
        
        // Update position
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Terrain avoidance
        const terrainHeight = this.game.getTerrainHeightAt(this.x + this.width / 2);
        if (this.y + this.height > terrainHeight - 50) {
            this.pitch = Math.max(this.pitch - 1 * deltaTime, -Math.PI / 4);
            this.power = Math.min(this.power + deltaTime, 1.0);
        }
        
        // Shooting at player
        if (distToPlayer < 400 && Math.abs(this.game.player.y - this.y) < 100) {
            this.shootAtPlayer();
        }
    }
    
    executeAI(deltaTime) {
        switch (this.aiState) {
            case 'patrol':
                // Gentle circling pattern
                this.pitch += Math.sin(this.aiTimer * 0.5) * 0.5 * deltaTime;
                this.power = 0.6;
                break;
                
            case 'chase':
                // Aim toward player
                const angleToPlayer = Math.atan2(
                    this.game.player.y - this.y,
                    this.game.player.x - this.x
                );
                this.pitch = this.lerp(this.pitch, angleToPlayer, 2 * deltaTime);
                this.power = 0.8;
                break;
                
            case 'loop':
                // Perform barrel roll/loop
                const loopProgress = (this.aiTimer - this.loopStartTime) * 2;
                if (loopProgress < Math.PI * 2) {
                    this.pitch = loopProgress;
                    this.power = 0.9;
                } else {
                    this.aiState = 'patrol';
                    this.pitch = 0;
                }
                break;
                
            case 'evade':
                // Random evasive maneuvers
                this.pitch += (Math.random() - 0.5) * 3 * deltaTime;
                this.power = 1.0;
                if (this.aiTimer > 2) {
                    this.aiState = 'patrol';
                }
                break;
        }
        
        // Clamp pitch
        this.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.pitch));
    }
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    shootAtPlayer() {
        if (Date.now() - this.lastShot > 1200) {
            const bulletSpeed = 400;
            const angleToPlayer = Math.atan2(
                this.game.player.y - this.y,
                this.game.player.x - this.x
            );
            
            const bulletVelX = Math.cos(angleToPlayer) * bulletSpeed;
            const bulletVelY = Math.sin(angleToPlayer) * bulletSpeed;
            
            // Create enemy bullet
            this.game.enemyBullets.push(new EnemyBullet(
                this.game,
                this.x + this.width / 2,
                this.y + this.height / 2,
                bulletVelX,
                bulletVelY
            ));
            
            this.lastShot = Date.now();
        }
    }
    
    render() {
        const ctx = this.game.ctx;
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Apply pitch rotation for visual feedback during maneuvers
        ctx.rotate(this.pitch);
        
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

class EnemyBullet {
    constructor(game, x, y, speedX, speedY) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.width = 4;
        this.height = 2;
    }
    
    update(deltaTime) {
        this.x += this.speedX * deltaTime;
        this.y += this.speedY * deltaTime;
    }
    
    render() {
        this.game.ctx.fillStyle = '#FF4500'; // Orange-red enemy bullets
        this.game.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Bird {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 6;
        this.velocityX = -30 - Math.random() * 20; // Slow moving left
        this.velocityY = Math.sin(Date.now() * 0.001) * 10; // Gentle up/down movement
        this.wingTimer = Math.random() * Math.PI * 2; // Random wing animation start
        this.originalY = y;
    }
    
    update(deltaTime) {
        this.x += this.velocityX * deltaTime;
        
        // Gentle sine wave flight pattern
        this.wingTimer += deltaTime * 8;
        this.y = this.originalY + Math.sin(this.wingTimer) * 15;
        
        // Random direction changes
        if (Math.random() < 0.005) {
            this.velocityY += (Math.random() - 0.5) * 20;
            this.velocityY = Math.max(-30, Math.min(30, this.velocityY));
        }
    }
    
    render() {
        const ctx = this.game.ctx;
        
        // Draw simple bird shape
        ctx.fillStyle = '#654321'; // Brown color
        
        // Body (oval)
        ctx.beginPath();
        ctx.ellipse(this.x + 4, this.y + 3, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings (animated)
        const wingFlap = Math.sin(this.wingTimer * 4) * 0.5 + 0.5;
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        
        // Left wing
        ctx.beginPath();
        ctx.moveTo(this.x + 2, this.y + 3);
        ctx.lineTo(this.x - 2, this.y + 3 - wingFlap * 3);
        ctx.stroke();
        
        // Right wing
        ctx.beginPath();
        ctx.moveTo(this.x + 6, this.y + 3);
        ctx.lineTo(this.x + 10, this.y + 3 - wingFlap * 3);
        ctx.stroke();
    }
}

const game = new Game();
game.start();