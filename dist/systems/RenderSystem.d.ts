export declare class RenderSystem {
    private ctx;
    private width;
    private height;
    constructor(ctx: CanvasRenderingContext2D, width: number, height: number);
    renderSVGPath(pathData: string, fillColor: string, scale?: number, offsetX?: number, offsetY?: number): void;
    drawTitleScreen(): void;
    drawBackground(cameraX: number): void;
    private drawCloud;
    drawTerrain(cameraX: number, terrain: any[], getTerrainHeightAt: (x: number) => number): void;
    drawUI(player: any, score: number, getTerrainHeightAt: (x: number) => number): void;
}
//# sourceMappingURL=RenderSystem.d.ts.map