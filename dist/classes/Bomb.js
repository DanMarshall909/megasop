export class Bomb {
    constructor(game, x, y) {
        this.width = 8;
        this.height = 12;
        this.speedY = 200;
        this._game = game;
        this.x = x;
        this.y = y;
    }
    update(deltaTime) {
        this.y += this.speedY * deltaTime;
        this.speedY += 100 * deltaTime; // Gravity acceleration
    }
    render(ctx) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    getX() { return this.x; }
    getY() { return this.y; }
    getWidth() { return this.width; }
    getHeight() { return this.height; }
}
//# sourceMappingURL=Bomb.js.map