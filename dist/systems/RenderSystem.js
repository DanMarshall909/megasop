// RenderSystem for MegaSop game
export class RenderSystem {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
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
    drawBackground(cameraX) {
        // Multiple cloud layers for parallax effect
        this.ctx.fillStyle = '#ffffff';
        // Far clouds (slowest)
        const farCloudOffset = cameraX * 0.1;
        for (let i = 0; i < 8; i++) {
            const x = (i * 300 - farCloudOffset) % (this.width + 200) + cameraX - 100;
            const y = 30 + Math.sin(i * 0.5) * 20;
            this.ctx.globalAlpha = 0.4;
            this.drawCloud(x, y, 0.8);
        }
        // Medium clouds
        const medCloudOffset = cameraX * 0.3;
        for (let i = 0; i < 6; i++) {
            const x = (i * 250 - medCloudOffset) % (this.width + 150) + cameraX - 75;
            const y = 80 + Math.sin(i * 0.7) * 25;
            this.ctx.globalAlpha = 0.6;
            this.drawCloud(x, y, 1.0);
        }
        // Near clouds (fastest)
        const nearCloudOffset = cameraX * 0.6;
        for (let i = 0; i < 4; i++) {
            const x = (i * 200 - nearCloudOffset) % (this.width + 100) + cameraX - 50;
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
    drawTerrain(cameraX, terrain, getTerrainHeightAt) {
        this.ctx.fillStyle = '#8B4513'; // Brown terrain
        this.ctx.strokeStyle = '#654321'; // Darker brown outline
        this.ctx.lineWidth = 2;
        // Only draw terrain visible on screen
        const startX = Math.max(0, cameraX - 100);
        const endX = cameraX + this.width + 100;
        this.ctx.beginPath();
        // Start from bottom of screen
        this.ctx.moveTo(startX, this.height);
        // Draw terrain curve
        for (let x = startX; x <= endX; x += 20) {
            const terrainHeight = getTerrainHeightAt(x);
            this.ctx.lineTo(x, terrainHeight);
        }
        // Close the shape at bottom right
        this.ctx.lineTo(endX, this.height);
        this.ctx.closePath();
        // Fill and stroke
        this.ctx.fill();
        this.ctx.stroke();
        // Add grass on top
        this.ctx.fillStyle = '#228B22'; // Forest green
        this.ctx.beginPath();
        this.ctx.moveTo(startX, getTerrainHeightAt(startX));
        for (let x = startX; x <= endX; x += 20) {
            const terrainHeight = getTerrainHeightAt(x);
            this.ctx.lineTo(x, terrainHeight);
        }
        // Add grass layer (10 pixels thick)
        for (let x = endX; x >= startX; x -= 20) {
            const terrainHeight = getTerrainHeightAt(x);
            this.ctx.lineTo(x, terrainHeight - 10);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    drawUI(player, score, getTerrainHeightAt) {
        this.ctx.fillStyle = '#333';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${score}`, 10, 30);
        // Power indicator
        this.ctx.fillText(`Power: ${Math.round(player.getPower() * 100)}%`, 10, 60);
        // Power bar
        this.ctx.strokeStyle = '#333';
        this.ctx.strokeRect(10, 70, 200, 20);
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(10, 70, 200 * player.getPower(), 20);
        // Pitch indicator
        const pitchDegrees = Math.round(player.getPitch() * 180 / Math.PI);
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(`Pitch: ${pitchDegrees}°`, 10, 120);
        // Speed indicator
        const speed = Math.sqrt(player.getVelocityX() * player.getVelocityX() + player.getVelocityY() * player.getVelocityY());
        this.ctx.fillText(`Speed: ${Math.round(speed)}`, 10, 150);
        // Roll rate indicator
        const rollRateDPS = Math.round(player.getRollRate() * 180 / Math.PI);
        this.ctx.fillText(`Roll Rate: ${rollRateDPS}°/s`, 10, 180);
        // Stall warning
        if (speed < player.getStallSpeed()) {
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillText('STALL!', 10, 210);
        }
        // Altitude indicator
        const groundLevel = getTerrainHeightAt(player.getX() + player.getWidth() / 2);
        const altitude = Math.max(0, Math.round(groundLevel - (player.getY() + player.getHeight())));
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(`Altitude: ${altitude}ft`, 10, 240);
        // Health indicator
        this.ctx.fillText(`Health: ${Math.round(player.getHealth())}%`, 10, 270);
        // Health bar
        const barWidth = 100;
        const barHeight = 10;
        this.ctx.strokeStyle = '#333';
        this.ctx.strokeRect(10, 280, barWidth, barHeight);
        const healthPercent = player.getHealth() / player.getMaxHealth();
        this.ctx.fillStyle = healthPercent > 0.5 ? '#00FF00' : healthPercent > 0.25 ? '#FFFF00' : '#FF0000';
        this.ctx.fillRect(10, 280, barWidth * healthPercent, barHeight);
    }
}
//# sourceMappingURL=RenderSystem.js.map