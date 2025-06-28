export declare class AudioSystem {
    private audioContext;
    private soundEnabled;
    private currentSound;
    private soundPriority;
    private titleMusicPosition;
    private titleMusicTimer;
    private readonly SOUND_PRIORITIES;
    private readonly frequencies;
    private readonly titleMelody;
    constructor();
    private initialize;
    private playPCSpeakerTone;
    playEngineSound(powerLevel: number): void;
    playShootSound(): void;
    playBombSound(): void;
    playExplosionSound(): void;
    playHitSound(): void;
    private playFrequencySweep;
    playTitleMusic(): void;
    updateTitleMusic(deltaTime: number): void;
    resetTitleMusic(): void;
}
//# sourceMappingURL=AudioSystem.d.ts.map