# Original Sopwith Game Reference

Based on analysis of the SDL Sopwith port at https://github.com/fragglet/sdl-sopwith

## Sound System Design

### Sound Priority Levels (Higher number = higher priority)
- Title screen sound: Priority 5
- Explosion sound: Priority 10  
- Bomb sound: Priority 20
- Shot sound: Priority 30
- Falling sound: Priority 40
- Hit sound: Priority 50
- Plane sound: Priority 60

### Musical Scale System
- Originally used A natural minor scale
- Modern ports shifted to C major scale
- Uses frequency table for note generation
- Supports octave shifts with '<' and '>' symbols
- Note modifications with sharps and flats

### PC Speaker Sound Generation
- Frequency-based tone production
- Limited to single tone at a time
- Creative use of timing and frequency modulation
- Sound effects use specific frequency patterns

## Game Mechanics

### Title Screen
- Alternates between title and high score every 10 seconds
- Shows game name, version, copyright, credits
- Menu for game mode selection
- Plays continuous title music

### Core Gameplay
- Bi-plane shoot-'em-up style
- TCP/IP multiplayer support
- Custom level loading
- Medal/scoring system
- Terrain interaction with buildings and ground

### Authentic Features
- PC speaker audio emulation
- Multiple monitor palette emulations
- Cross-platform compatibility via SDL
- Faithful recreation of original mechanics

## Technical Implementation
- Uses LibSDL for modern compatibility
- Emscripten support for web play
- Custom music notation system
- Sound priority management
- Continuous tone tracking

## References
- Original by BMB Compuscience Canada
- Source released under GNU GPL by David L. Clark
- SDL port by Simon Howard (fragglet)