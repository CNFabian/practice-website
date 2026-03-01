import Phaser from 'phaser';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { ASSET_KEYS } from '../constants/AssetKeys';
// Typography constants imported via createTextStyle helper
import {
  HouseBackground,
  LessonHouse,
  House1,
  House2,
  House3,
  House4,
  House5,
  HouseCloud,
  BirdIdle,
  BirdFly,
  BirdCelebration,
  BirdHappy,
  MinigameIcon,
  BirdWithPencil,
  BirdSad,
  BirdWithCoin,
  CoinCounterIcon,
  stage1Tree,
  stage2Tree,
  stage3Tree,
  stage4Tree,
  stage5Tree,
  Neighborhood1,
  Neighborhood2,
  Neighborhood3,
  NeighborhoodMap,
  NeighborhoodShadow,
  LockIcon,
  RoadblockIcon,
  NoticeBirdIcon,
  VideoProgressIcon,
  DocumentProgressIcon,
  ProgressStarIcon,
  FrontGrass,
  BackgroundCloud,
  GrowYourNestBackground,
  WateringCanStill,
  WateringCanWatering,
  FertilizerStill,
  FertilizerPouring,
  TreeShadow,
  BirdNestStanding,
  LessonCard,
  RoomLockOverlay0,
  RoomLockOverlay1,
  RoomLockOverlay2,
  RoomLockOverlay3,
  BackArrowIcon,
  BackArrowHoverIcon,
} from '../../assets/phaser';

// ═══════════════════════════════════════════════════════════════════
// ASSET LOADING TIERS — OPT-02 Performance Optimization
// Assets are split into 3 tiers to reduce initial load time.
// Only Tier 1 blocks game start; Tiers 2-3 load in background.
// ═══════════════════════════════════════════════════════════════════

interface AssetDefinition {
  key: string;
  path: string;
  type: 'image' | 'svg';
  svgWidth?: number;
  svgHeight?: number;
}

/** Tier 1: MapScene + BaseScene essentials — blocks game start (11 assets) */
const CRITICAL_ASSETS: AssetDefinition[] = [
  // MapScene backgrounds & icons
  { key: ASSET_KEYS.NEIGHBORHOOD_MAP_BACKGROUND, path: NeighborhoodMap, type: 'image' },
  { key: ASSET_KEYS.NEIGHBORHOOD_1, path: Neighborhood1, type: 'image' },
  { key: ASSET_KEYS.NEIGHBORHOOD_2, path: Neighborhood2, type: 'image' },
  { key: ASSET_KEYS.NEIGHBORHOOD_3, path: Neighborhood3, type: 'image' },
  { key: ASSET_KEYS.NEIGHBORHOOD_SHADOW, path: NeighborhoodShadow, type: 'image' },
  { key: ASSET_KEYS.LOCK_ICON, path: LockIcon, type: 'image' },
  { key: ASSET_KEYS.ROADBLOCK_ICON, path: RoadblockIcon, type: 'image' },
  { key: ASSET_KEYS.NOTICE_BIRD_ICON, path: NoticeBirdIcon, type: 'image' },
  // BaseScene essentials (used by all scenes)
  { key: ASSET_KEYS.COIN_ICON, path: CoinCounterIcon, type: 'image' },
  { key: ASSET_KEYS.BIRD_IDLE, path: BirdIdle, type: 'image' },
  { key: ASSET_KEYS.BIRD_FLY, path: BirdFly, type: 'image' },
  // Back button icons (used by NeighborhoodScene, HouseScene, GYN minigame)
  { key: ASSET_KEYS.BACK_ARROW, path: BackArrowIcon, type: 'image' },
  { key: ASSET_KEYS.BACK_ARROW_HOVER, path: BackArrowHoverIcon, type: 'image' },
];

/** Tier 2: NeighborhoodScene + HouseScene — background load after map visible (22 assets) */
const SECONDARY_ASSETS: AssetDefinition[] = [
  // NeighborhoodScene
  { key: ASSET_KEYS.HOUSE_1, path: House1, type: 'image' },
  { key: ASSET_KEYS.HOUSE_2, path: House2, type: 'image' },
  { key: ASSET_KEYS.HOUSE_3, path: House3, type: 'image' },
  { key: ASSET_KEYS.HOUSE_4, path: House4, type: 'image' },
  { key: ASSET_KEYS.HOUSE_5, path: House5, type: 'image' },
  { key: ASSET_KEYS.HOUSE_CLOUD, path: HouseCloud, type: 'image' },
  { key: ASSET_KEYS.BACKGROUND_CLOUD, path: BackgroundCloud, type: 'image' },
  // HouseScene
  { key: ASSET_KEYS.SUBURBAN_BACKGROUND, path: HouseBackground, type: 'image' },
  { key: ASSET_KEYS.LESSON_HOUSE, path: LessonHouse, type: 'image' },
  { key: ASSET_KEYS.LESSON_CARD, path: LessonCard, type: 'image' },
  { key: ASSET_KEYS.VIDEO_PROGRESS_ICON, path: VideoProgressIcon, type: 'image' },
  { key: ASSET_KEYS.DOCUMENT_PROGRESS_ICON, path: DocumentProgressIcon, type: 'image' },
  { key: ASSET_KEYS.PROGRESS_STAR_ICON, path: ProgressStarIcon, type: 'image' },
  { key: ASSET_KEYS.FRONT_GRASS, path: FrontGrass, type: 'image' },
  // Bird celebration (SVG with dimensions)
  { key: ASSET_KEYS.BIRD_CELEBRATION, path: BirdCelebration, type: 'image' },
  { key: ASSET_KEYS.BIRD_HAPPY, path: BirdHappy, type: 'image' },
  { key: ASSET_KEYS.MINIGAME_ICON, path: MinigameIcon, type: 'image' },
  { key: ASSET_KEYS.BIRD_WITH_PENCIL, path: BirdWithPencil, type: 'image' },
  { key: ASSET_KEYS.BIRD_SAD, path: BirdSad, type: 'image' },
  { key: ASSET_KEYS.BIRD_WITH_COIN, path: BirdWithCoin, type: 'image' },
  { key: ASSET_KEYS.BIRD_NEST_STANDING, path: BirdNestStanding, type: 'image' },
  // Tree stage images — needed by HouseProgressCard minigame indicator on hover
  // Moved from Tier 3 to Tier 2 so they are available when NeighborhoodScene renders
  { key: ASSET_KEYS.TREE_STAGE_1, path: stage1Tree, type: 'image' },
  { key: ASSET_KEYS.TREE_STAGE_2, path: stage2Tree, type: 'image' },
  { key: ASSET_KEYS.TREE_STAGE_3, path: stage3Tree, type: 'image' },
  { key: ASSET_KEYS.TREE_STAGE_4, path: stage4Tree, type: 'image' },
  { key: ASSET_KEYS.TREE_STAGE_5, path: stage5Tree, type: 'image' },
  // Room lock overlays (HouseScene)
  { key: ASSET_KEYS.ROOM_LOCK_OVERLAY_0, path: RoomLockOverlay0, type: 'image' },
  { key: ASSET_KEYS.ROOM_LOCK_OVERLAY_1, path: RoomLockOverlay1, type: 'image' },
  { key: ASSET_KEYS.ROOM_LOCK_OVERLAY_2, path: RoomLockOverlay2, type: 'image' },
  { key: ASSET_KEYS.ROOM_LOCK_OVERLAY_3, path: RoomLockOverlay3, type: 'image' },
];

/** Tier 3: GrowYourNest minigame — load on-demand when minigame starts (5 assets) */
const DEFERRED_ASSETS: AssetDefinition[] = [
  { key: ASSET_KEYS.GROW_YOUR_NEST_BACKGROUND, path: GrowYourNestBackground, type: 'image' },
  { key: ASSET_KEYS.TREE_SHADOW, path: TreeShadow, type: 'image' },
  { key: ASSET_KEYS.WATERING_CAN_STILL, path: WateringCanStill, type: 'image' },
  { key: ASSET_KEYS.WATERING_CAN_POURING, path: WateringCanWatering, type: 'image' },
  { key: ASSET_KEYS.FERTILIZER_STILL, path: FertilizerStill, type: 'image' },
  { key: ASSET_KEYS.FERTILIZER_POURING, path: FertilizerPouring, type: 'image' },
];

export default class PreloaderScene extends Phaser.Scene {
  private progressBar?: Phaser.GameObjects.Graphics;
  private progressBox?: Phaser.GameObjects.Graphics;
  private loadingText?: Phaser.GameObjects.Text;
  private percentText?: Phaser.GameObjects.Text;
  private shouldLoad: boolean = true;
  private secondaryLoading: boolean = false;
  private deferredLoading: boolean = false;

  constructor() {
    super({ key: SCENE_KEYS.PRELOADER });
  }

  init() {
    const assetsLoaded = this.registry.get('assetsLoaded');
    this.shouldLoad = !assetsLoaded;
    console.log('PreloaderScene.init: shouldLoad =', this.shouldLoad);
  }

  preload(): void {
    if (!this.shouldLoad) {
      console.log('PreloaderScene.preload: Skipping asset loading (already loaded)');
      return;
    }

    console.log('PreloaderScene.preload: Starting asset load');

    // ═══════════════════════════════════════════════════════════
    // FONTS ARE LOADED BY fonts.css - NO DUPLICATE LOADING NEEDED
    // The broken loadOnestFonts() method has been REMOVED
    // ═══════════════════════════════════════════════════════════
    
    // Loading UI is handled by React's LoadingSpinner component —
    // no need for a Phaser-side progress bar.

    // Track failed assets for retry
    const failedAssets: string[] = [];

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error(`❌ PreloaderScene: Failed to load asset "${file.key}" from ${file.url}`);
      failedAssets.push(file.key);
    });

    this.load.on('complete', () => {
      this.cleanup();
    });

    // Load only Tier 1 (Critical) assets — MapScene + BaseScene essentials
    // Tier 2 (Secondary) and Tier 3 (Deferred) load in background after map is visible
    CRITICAL_ASSETS.forEach((asset) => {
      if (asset.type === 'svg') {
        this.load.svg(asset.key, asset.path, { width: asset.svgWidth, height: asset.svgHeight });
      } else {
        this.load.image(asset.key, asset.path);
      }
    });
  }

  create(): void {
    if (this.shouldLoad) {
      console.log('✓ PreloaderScene.create: Assets loaded');

      // Verify all critical textures actually loaded (not just queued)
      const missingTextures = CRITICAL_ASSETS.filter(
        (asset) => !this.textures.exists(asset.key) || this.textures.get(asset.key).key === '__MISSING'
      );

      if (missingTextures.length > 0) {
        console.warn(`⚠️ PreloaderScene: ${missingTextures.length} critical textures missing after load, retrying...`);
        this.reloadMissingAssets(missingTextures);
        return; // Don't proceed until retry completes
      }
    } else {
      console.log('✓ PreloaderScene.create: No loading needed');
    }

    this.finishCreate();
  }

  /**
   * Retry loading assets that failed during the initial preload.
   * Attempts up to 2 retries before proceeding anyway.
   */
  private retryCount = 0;
  private readonly MAX_RETRIES = 2;

  private reloadMissingAssets(missingAssets: AssetDefinition[]): void {
    this.retryCount++;
    console.log(`🔄 PreloaderScene: Retry attempt ${this.retryCount}/${this.MAX_RETRIES} for ${missingAssets.length} assets`);

    // Remove failed textures so they can be re-loaded
    missingAssets.forEach((asset) => {
      if (this.textures.exists(asset.key)) {
        this.textures.remove(asset.key);
      }
    });

    // Queue them for loading again
    missingAssets.forEach((asset) => {
      if (asset.type === 'svg') {
        this.load.svg(asset.key, asset.path, { width: asset.svgWidth, height: asset.svgHeight });
      } else {
        this.load.image(asset.key, asset.path);
      }
    });

    const onRetryComplete = () => {
      this.load.off('complete', onRetryComplete);

      // Check again
      const stillMissing = missingAssets.filter(
        (asset) => !this.textures.exists(asset.key) || this.textures.get(asset.key).key === '__MISSING'
      );

      if (stillMissing.length > 0 && this.retryCount < this.MAX_RETRIES) {
        console.warn(`⚠️ PreloaderScene: ${stillMissing.length} textures still missing, retrying...`);
        this.reloadMissingAssets(stillMissing);
      } else {
        if (stillMissing.length > 0) {
          console.error(`❌ PreloaderScene: ${stillMissing.length} textures failed after ${this.MAX_RETRIES} retries:`,
            stillMissing.map(a => a.key));
        } else {
          console.log(`✓ PreloaderScene: All critical textures loaded after retry`);
        }
        this.finishCreate();
      }
    };

    this.load.on('complete', onRetryComplete);
    this.load.start();
  }

  private finishCreate(): void {
    this.registry.set('assetsLoaded', true);

    const fontTimeout = new Promise<string>((resolve) =>
      setTimeout(() => resolve('timeout'), 500)
    );
    const fontReady = document.fonts.ready.then(() => 'fonts-loaded' as string);

    Promise.race([fontReady, fontTimeout]).then((result) => {
      if (result === 'timeout') {
        console.log('⚡ PreloaderScene: Font timeout reached — proceeding without waiting');
      } else {
        console.log('✓ PreloaderScene: Onest fonts ready from fonts.css');
      }
      this.scene.sleep();
      console.log('✓ PreloaderScene sleeping, loader available for background asset loading');
    });
  }

  shutdown() {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.progressBar) {
      this.progressBar.destroy();
      this.progressBar = undefined;
    }
    if (this.progressBox) {
      this.progressBox.destroy();
      this.progressBox = undefined;
    }
    if (this.loadingText) {
      this.loadingText.destroy();
      this.loadingText = undefined;
    }
    if (this.percentText) {
      this.percentText.destroy();
      this.percentText = undefined;
    }
  }

  /**
   * Load Tier 2 assets in the background after MapScene is visible.
   * Called by GameManager once assetsLoaded is true.
   * Sets registry flag 'secondaryAssetsLoaded' on completion.
   */
  loadSecondaryAssets(): void {
    if (this.secondaryLoading || this.registry.get('secondaryAssetsLoaded')) {
      return;
    }
    this.secondaryLoading = true;
    console.log('PreloaderScene: Starting Tier 2 (Secondary) background load');

    SECONDARY_ASSETS.forEach((asset) => {
      // Skip if already loaded (e.g., from a previous session)
      if (this.textures.exists(asset.key)) return;
      if (asset.type === 'svg') {
        this.load.svg(asset.key, asset.path, { width: asset.svgWidth, height: asset.svgHeight });
      } else {
        this.load.image(asset.key, asset.path);
      }
    });

    const onComplete = () => {
      this.load.off('complete', onComplete);
      this.registry.set('secondaryAssetsLoaded', true);
      console.log('✓ PreloaderScene: Tier 2 (Secondary) assets loaded');
    };
    this.load.on('complete', onComplete);
    this.load.start();
  }

  /**
   * Load Tier 3 assets on-demand when the minigame is first navigated to.
   * Called by GameManager when user enters minigame view.
   * Sets registry flag 'deferredAssetsLoaded' on completion.
   */
  loadDeferredAssets(): void {
    if (this.deferredLoading || this.registry.get('deferredAssetsLoaded')) {
      return;
    }
    this.deferredLoading = true;
    console.log('PreloaderScene: Starting Tier 3 (Deferred) background load');

    DEFERRED_ASSETS.forEach((asset) => {
      // Skip if already loaded
      if (this.textures.exists(asset.key)) return;
      if (asset.type === 'svg') {
        this.load.svg(asset.key, asset.path, { width: asset.svgWidth, height: asset.svgHeight });
      } else {
        this.load.image(asset.key, asset.path);
      }
    });

    const onComplete = () => {
      this.load.off('complete', onComplete);
      this.registry.set('deferredAssetsLoaded', true);
      console.log('✓ PreloaderScene: Tier 3 (Deferred) assets loaded');
    };
    this.load.on('complete', onComplete);
    this.load.start();
  }
}