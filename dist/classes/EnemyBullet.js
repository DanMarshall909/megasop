export class EnemyBullet {
    constructor(game, x, y, speedX, speedY) {
        this.width = 4;
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
        ctx.fillStyle = '#FF4500'; // Orange-red enemy bullets
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    getX() { return this.x; }
    getY() { return this.y; }
    getWidth() { return this.width; }
    getHeight() { return this.height; }
}
//# sourceMappingURL=EnemyBullet.js.map