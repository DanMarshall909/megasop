import { Game } from './classes/Game.js';
// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.start();
});
// Handle page visibility changes for better performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Game will automatically pause due to requestAnimationFrame behavior
        console.log('Game paused - tab is hidden');
    }
    else {
        console.log('Game resumed - tab is visible');
    }
});
//# sourceMappingURL=main.js.map