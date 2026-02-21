# Phaser Game Module - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Core Concepts](#core-concepts)
5. [Scene Flow](#scene-flow)
6. [Components Reference](#components-reference)
7. [Development Guide](#development-guide)

---

## Overview

### What Is This?
The Phaser Game Module is a gamified learning interface built with Phaser 3 that provides an interactive, visual way for users to navigate through educational content. It uses a game-like environment where users explore neighborhoods, visit houses, and complete lessons.

### Key Features
- 🗺️ **Interactive Map** - Visual navigation through learning neighborhoods
- 🏘️ **Neighborhood Exploration** - Walk through different themed areas
- 🏠 **House Interior** - Access learning modules inside houses
- 🐦 **Character Animation** - Animated bird character that guides the user
- 🎮 **Gamification** - Progress tracking, unlockable content, and minigames
- 📱 **Responsive Design** - Adapts to different screen sizes
- 🎨 **Smooth Transitions** - Professional fade effects between scenes

### Technology Stack
- **Phaser 3** - Game framework for rendering and animation
- **TypeScript** - Type-safe development
- **React** - Parent application framework
- **Tailwind CSS** - Styling for non-Phaser UI elements

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Layer (ModulesPage)               │
│  - Navigation State Management                              │
│  - Phaser Container Management                              │
│  - React Router Integration                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  GameManager (Singleton)                    │
│  - Phaser Instance Lifecycle                                │
│  - Asset Loading State                                      │
│  - Scene Registry Management                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Phaser Game Instance                     │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ Preloader   │  Map Scene  │ Neighbor-   │ House Scene │  │
│  │   Scene     │             │ hood Scene  │             │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Action → React Component → GameManager → Scene Registry → 
Active Scene → Transition Manager → Next Scene → Update React State
```

---

## Project Structure

```
frontend/src/pages/protected/modules/phaser/
│
├── 📁 constants/
│   ├── SceneKeys.ts              # Scene identifier constants
│   ├── AssetKeys.ts              # Asset key constants
│   └── Colors.ts                 # Color palette and opacity values
│
├── 📁 ui/
│   ├── CardBuilder.ts            # Reusable card creation utilities
│   ├── ButtonBuilder.ts          # Reusable button creation utilities
│   └── UIComponents.ts           # Other reusable UI components
│
├── 📁 managers/
│   ├── GameManager.ts            # Singleton game lifecycle manager
│   └── SceneTransitionManager.ts # Scene transition orchestration
│
├── 📁 scenes/
│   ├── PreloaderScene.ts         # Asset loading and caching
│   ├── MapScene.ts               # Top-level map navigation
│   ├── NeighborhoodScene.ts      # House selection within neighborhood
│   └── HouseScene.ts             # Lesson selection within house
│
├── 📁 types/
│   └── index.ts                  # Shared TypeScript interfaces
│
└── 📁 config/
    └── gameConfig.ts             # Phaser configuration
```

---

## Core Concepts

### 1. Singleton Game Manager

The `GameManager` ensures only one Phaser game instance exists across the entire application lifecycle.

**Key Responsibilities:**
- Create and maintain the Phaser game instance
- Manage asset loading state
- Provide access to the game instance
- Handle game pause/resume
- Persist across React component unmounts

**Usage:**
```typescript
import GameManager from './GameManager';

// Initialize game
const game = GameManager.initializeGame(containerElement);

// Check if ready
if (GameManager.isReady()) {
  // Game is initialized
}

// Get game instance
const game = GameManager.getGame();

// Pause/Resume
GameManager.pause();
GameManager.resume();
```

### 2. Scene System

Scenes are independent game states that represent different views in the application.

**Scene Lifecycle:**
```
init() → preload() → create() → update() → shutdown()
```

**Scene Types:**

#### PreloaderScene
- **Purpose:** Load all game assets
- **When Active:** Only on first game initialization
- **Transitions To:** None (automatically stops after loading)
- **Special Features:** Progress bar, asset caching

#### MapScene
- **Purpose:** Display available neighborhoods
- **When Active:** Top-level navigation view
- **Transitions To:** NeighborhoodScene
- **User Actions:** Select neighborhood to explore

#### NeighborhoodScene
- **Purpose:** Display houses within a neighborhood
- **When Active:** After selecting a neighborhood
- **Transitions To:** HouseScene, MapScene (back)
- **User Actions:** Select house, navigate bird character, return to map
- **Special Features:** Bird character with idle/travel animations

#### HouseScene
- **Purpose:** Display lessons within a house
- **When Active:** After selecting a house
- **Transitions To:** NeighborhoodScene (back), Lesson views
- **User Actions:** Select lesson, access minigame, return to neighborhood
- **Special Features:** Bird entrance animations, lesson grid

### 3. Scene Communication

Scenes communicate through the **Phaser Registry** - a shared data store accessible by all scenes.

**Registry Data:**
```typescript
interface RegistryData {
  // Asset state
  assetsLoaded: boolean;
  
  // Navigation handlers (from React)
  handleNeighborhoodSelect: (id: string) => void;
  handleHouseSelect: (id: string) => void;
  handleLessonSelect: (id: number) => void;
  handleMinigameSelect: () => void;
  handleBackToMap: () => void;
  handleBackToNeighborhood: () => void;
  
  // Navigation state
  currentHouseIndex: number;
  birdTravelInfo: BirdTravelInfo;
  returningFromLesson: boolean;
  
  // Data
  neighborhoodHouses: { [key: string]: HousePosition[] };
}
```

**Setting Registry Data:**
```typescript
this.registry.set('currentHouseIndex', 5);
```

**Getting Registry Data:**
```typescript
const index = this.registry.get('currentHouseIndex');
```

### 4. React ↔ Phaser Integration

The integration works through callback functions stored in the registry.

**Flow:**
1. React defines navigation handlers
2. React stores handlers in Phaser registry
3. Phaser scenes retrieve and call handlers
4. React updates state and manages routing
5. React starts appropriate Phaser scene

**Example:**
```typescript
// In React (ModulesPage.tsx)
const handleHouseSelect = (houseId: string) => {
  setNavState(prev => ({
    ...prev,
    currentView: 'house',
    houseId: houseId,
  }));
};

// Store in registry
scene.registry.set('handleHouseSelect', handleHouseSelect);

// In Phaser scene
const handler = this.registry.get('handleHouseSelect');
if (handler) {
  handler('house-123');
}
```

---

## Scene Flow

### Complete User Journey

```
┌─────────────┐
│  App Start  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ PreloaderScene  │ ← Load all assets once
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   MapScene      │ ← Select neighborhood
│  (Sky Blue BG)  │
└──────┬──────────┘
       │ Click "Downtown"
       ▼
┌─────────────────┐
│ NeighborhoodScen│ ← Select house, navigate bird
│  (Orange BG)    │
└──────┬──────────┘
       │ Click house
       ▼
┌─────────────────┐
│  HouseScene     │ ← Select lesson/minigame
│ (Suburban BG)   │
└──────┬──────────┘
       │ Click lesson
       ▼
┌─────────────────┐
│  Lesson View    │ ← React component, not Phaser
│  (React UI)     │
└─────────────────┘
```

### Scene Transitions

Transitions use camera fade effects for smooth visual flow.

**Transition Colors:**
- **Black Fade:** Map ↔ Neighborhood
- **Orange Fade:** Neighborhood ↔ Map (back)
- **Peach Fade:** House ↔ Neighborhood

**Transition Manager Usage:**
```typescript
private transitionManager: SceneTransitionManager;

create() {
  this.transitionManager = new SceneTransitionManager(this);
  this.transitionManager.enterNeighborhood(); // Fade in
}

handleClick() {
  this.transitionManager.toHouse(() => {
    // Navigate to house
  });
}
```

---

## Components Reference

### Constants

#### SceneKeys.ts
Centralized scene identifiers to prevent typos.

```typescript
export const SCENE_KEYS = {
  PRELOADER: 'PreloaderScene',
  MAP: 'MapScene',
  NEIGHBORHOOD: 'NeighborhoodScene',
  HOUSE: 'HouseScene',
} as const;

// Usage
this.scene.start(SCENE_KEYS.MAP);
```

#### AssetKeys.ts
All asset identifiers in one place.

```typescript
export const ASSET_KEYS = {
  SUBURBAN_BACKGROUND: 'suburbanBackground',
  BIRD_IDLE: 'bird_idle',
  BIRD_FLY: 'bird_fly',
  HOUSE_1: 'house1',
  // ... more assets
} as const;

// Usage
this.add.image(x, y, ASSET_KEYS.BIRD_IDLE);
```

#### Colors.ts
Color palette and opacity values.

```typescript
export const COLORS = {
  BLUE_500: 0x3b82f6,
  GREEN_500: 0x10b981,
  TEXT_PRIMARY: '#1f2937',
  // ... more colors
} as const;

export const OPACITY = {
  FULL: 1,
  HIGH: 0.9,
  MEDIUM: 0.6,
  // ... more opacity values
} as const;

// Usage
const rect = this.add.rectangle(x, y, w, h, COLORS.BLUE_500, OPACITY.HIGH);
```

### UI Builders

#### CardBuilder.ts
Create consistent card UI elements.

**Methods:**
- `createCard()` - Basic card with background
- `createCardWithIcon()` - Card with icon circle
- `createHeaderCard()` - Full header card with icon, title, subtitle

**Example:**
```typescript
const card = CardBuilder.createHeaderCard({
  scene: this,
  x: width / 2,
  y: height / 2,
  width: scale(400),
  height: scale(500),
  iconText: '🏠',
  titleText: 'House Name',
  subtitleText: 'Description',
  iconCircleColor: COLORS.BLUE_500,
});
```

#### ButtonBuilder.ts
Create interactive buttons with consistent styling.

**Methods:**
- `createButton()` - Basic rectangular button
- `createIconButton()` - Button with icon and text
- `createBackButton()` - Pre-configured back button
- `createLessonButton()` - Lesson button with completion states

**Example:**
```typescript
const button = ButtonBuilder.createButton({
  scene: this,
  x: 100,
  y: 100,
  width: scale(120),
  height: scale(40),
  text: 'Click Me',
  backgroundColor: COLORS.BLUE_500,
  hoverColor: COLORS.BLUE_600,
  onClick: () => this.handleClick(),
});
```

#### UIComponents.ts
Miscellaneous reusable UI elements.

**Methods:**
- `createBadge()` - Status badge
- `createIconCircle()` - Circular icon container
- `createTitle()` / `createSubtitle()` - Text components
- `createProgressBar()` - Loading progress indicator
- `createCheckmark()` / `createLockIcon()` - Icon helpers

### Managers

#### GameManager.ts
Singleton pattern for game instance management.

**Key Methods:**
```typescript
// Initialize game (creates or reuses instance)
GameManager.initializeGame(container: HTMLElement): Phaser.Game

// Get current instance
GameManager.getGame(): Phaser.Game | null

// Check states
GameManager.isReady(): boolean
GameManager.areAssetsLoaded(): boolean

// Control game
GameManager.pause(): void
GameManager.resume(): void
GameManager.destroy(): void
```

**Important Notes:**
- Only call `destroy()` on app unmount, not component unmount
- Game persists across route changes
- Assets are cached and don't reload

#### SceneTransitionManager.ts
Orchestrates scene transitions with consistent effects.

**Key Methods:**
```typescript
// Generic transitions
fadeIn(config?: TransitionConfig): void
fadeOut(config?: TransitionConfig): void

// Scene-specific transitions
toNeighborhood(callback: () => void): void
toHouse(callback: () => void): void
backToNeighborhood(callback: () => void): void
backToMap(callback: () => void): void

// Entrance effects
enterMap(): void
enterNeighborhood(): void
enterHouse(): void

// Utilities
isInProgress(): boolean
executeIfNotTransitioning(callback: () => void): boolean
cleanup(): void
```

**Usage Pattern:**
```typescript
export default class MyScene extends Phaser.Scene {
  private transitionManager: SceneTransitionManager;
  
  create() {
    this.transitionManager = new SceneTransitionManager(this);
    this.transitionManager.enterMap();
  }
  
  handleNavigation() {
    if (this.transitionManager.isInProgress()) return;
    
    this.transitionManager.toNeighborhood(() => {
      // Execute navigation
    });
  }
  
  shutdown() {
    this.transitionManager.cleanup();
  }
}
```

---

## Development Guide

### Adding a New Scene

**Step 1: Create the Scene File**
```typescript
// scenes/NewScene.ts
import Phaser from 'phaser';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { COLORS } from '../constants/Colors';
import { SceneTransitionManager } from '../managers/SceneTransitionManager';

export default class NewScene extends Phaser.Scene {
  private transitionManager: SceneTransitionManager;
  
  constructor() {
    super({ key: SCENE_KEYS.NEW_SCENE });
  }
  
  create() {
    this.transitionManager = new SceneTransitionManager(this);
    this.transitionManager.enterMap();
    
    // Create UI
    this.createUI();
  }
  
  private createUI(): void {
    // Implementation
  }
  
  shutdown() {
    this.transitionManager.cleanup();
  }
}
```

**Step 2: Add Scene Key Constant**
```typescript
// constants/SceneKeys.ts
export const SCENE_KEYS = {
  // ... existing keys
  NEW_SCENE: 'NewScene',
} as const;
```

**Step 3: Register Scene in Config**
```typescript
// config/gameConfig.ts
import NewScene from '../scenes/NewScene';

export const createGameConfig = (parent: HTMLElement) => {
  return {
    // ... other config
    scene: [PreloaderScene, MapScene, NeighborhoodScene, HouseScene, NewScene],
  };
};
```

**Step 4: Add Navigation in React**
```typescript
// ModulesPage.tsx
const handleNewSceneSelect = () => {
  setNavState(prev => ({
    ...prev,
    currentView: 'newscene',
  }));
};

// Store in registry
scene.registry.set('handleNewSceneSelect', handleNewSceneSelect);
```

### Adding a New Asset

**Step 1: Import Asset**
```typescript
// assets/index.ts
import NewAsset from './images/new-asset.png';

export {
  // ... existing exports
  NewAsset,
};
```

**Step 2: Add Asset Key**
```typescript
// constants/AssetKeys.ts
export const ASSET_KEYS = {
  // ... existing keys
  NEW_ASSET: 'newAsset',
} as const;
```

**Step 3: Load in PreloaderScene**
```typescript
// scenes/PreloaderScene.ts
import { NewAsset } from '../../../../../assets';

preload() {
  // ... other loads
  this.load.image(ASSET_KEYS.NEW_ASSET, NewAsset);
}
```

**Step 4: Use in Scenes**
```typescript
create() {
  this.add.image(x, y, ASSET_KEYS.NEW_ASSET);
}
```

### Adding a New UI Component

**Step 1: Create Component Method**
```typescript
// ui/UIComponents.ts
export class UIComponents {
  static createNewComponent(
    scene: Phaser.Scene,
    config: ComponentConfig
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(config.x, config.y);
    
    // Build component
    
    return container;
  }
}
```

**Step 2: Use in Scene**
```typescript
import { UIComponents } from '../ui/UIComponents';

create() {
  const component = UIComponents.createNewComponent(this, {
    x: 100,
    y: 100,
    // ... config
  });
}
```

### Scene Organization Template

Use this template for all new scenes:

```typescript
import Phaser from 'phaser';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { COLORS } from '../constants/Colors';
import { SceneTransitionManager } from '../managers/SceneTransitionManager';

export default class TemplateScene extends Phaser.Scene {
  // ═══════════════════════════════════════════════════════════
  // PROPERTIES
  // ═══════════════════════════════════════════════════════════
  private transitionManager: SceneTransitionManager;
  
  // ═══════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════
  constructor() {
    super({ key: SCENE_KEYS.TEMPLATE });
  }
  
  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE METHODS
  // ═══════════════════════════════════════════════════════════
  init(data: any) {}
  
  create() {
    this.setupCamera();
    this.createUI();
    this.setupEventListeners();
  }
  
  shutdown() {
    this.cleanupEventListeners();
    this.transitionManager.cleanup();
  }
  
  // ═══════════════════════════════════════════════════════════
  // SETUP METHODS
  // ═══════════════════════════════════════════════════════════
  private setupCamera(): void {
    this.transitionManager = new SceneTransitionManager(this);
    this.transitionManager.enterMap();
  }
  
  private setupEventListeners(): void {
    this.scale.on('resize', this.handleResize, this);
  }
  
  private cleanupEventListeners(): void {
    this.scale.off('resize', this.handleResize, this);
  }
  
  // ═══════════════════════════════════════════════════════════
  // UI CREATION METHODS
  // ═══════════════════════════════════════════════════════════
  private createUI(): void {
    // Create UI components
  }
  
  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  private handleResize(gameSize: Phaser.Structs.Size): void {
    // Handle resize
  }
  
  // ═══════════════════════════════════════════════════════════
  // TRANSITION METHODS
  // ═══════════════════════════════════════════════════════════
  private transitionToNext(): void {
    this.transitionManager.toNeighborhood(() => {
      // Navigate
    });
  }
}
```

---


## Version History

### v2.0.0 - Code Reorganization (Current)
- ✨ Extracted constants (SceneKeys, AssetKeys, Colors)
- ✨ Created UI component builders
- ✨ Reorganized all scene files
- ✨ Added SceneTransitionManager
- ✨ Extracted shared types
- 📚 Comprehensive documentation

### v1.0.0 - Initial Implementation
- ⚡ Phaser integration with React
- 🎮 Four scene system (Preloader, Map, Neighborhood, House)
- 🐦 Bird character with animations
- 🎨 Smooth transitions and effects

---

**Last Updated:** January 2026  
**Maintained By:** Christopher Fabian