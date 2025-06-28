export class Bullet {
    constructor(game, x, y, speedX, speedY) {
        this.width = 5;
        this.height = 2;
        this.game = game;
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
    }
    update(deltaTime) {
        this.x += this.speedX * deltaTime;
        this.y += this.speedY * deltaTime;
    }
    render(ctx) {
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    getX() { return this.x; }
    getY() { return this.y; }
    getWidth() { return this.width; }
    getHeight() { return this.height; }
}
//# sourceMappingURL=Bullet.js.map