export class Bird {
    constructor(game, x, y) {
        this.width = 8;
        this.height = 6;
        this._game = game;
        this.x = x;
        this.y = y;
        this.originalY = y;
        this.velocityX = -30 - Math.random() * 20; // Slow moving left
        this.velocityY = Math.sin(Date.now() * 0.001) * 10;
        this.wingTimer = Math.random() * Math.PI * 2;
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
    render(ctx) {
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
    getX() { return this.x; }
    getY() { return this.y; }
    getWidth() { return this.width; }
    getHeight() { return this.height; }
}
//# sourceMappingURL=Bird.js.map