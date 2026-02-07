import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { ASSET_KEYS } from '../constants/AssetKeys';
import { COLORS } from '../constants/Colors';
import { ButtonBuilder } from '../ui/ButtonBuilder';
import { BirdCharacter } from '../characters/BirdCharacter';
import { createTextStyle } from '../constants/Typography';
import { SceneTransitionManager } from '../managers/SceneTransitionManager';

interface Lesson {
  id: number;
  title: string;
  description?: string;
  type: string;
  completed: boolean;
  locked: boolean;
  x?: number;
  y?: number;
}

interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface HouseSceneData {
  houseId?: string;
  moduleId?: number;
  moduleBackendId?: string;
}

interface BirdTravelInfo {
  previousHouseIndex: number;
  currentHouseIndex: number;
  traveled: boolean;
}

interface ModuleLessonsData {
  id: number;
  title: string;
  lessons: Lesson[];
}

export default class HouseScene extends BaseScene {
  // ═══════════════════════════════════════════════════════════
  // PROPERTIES
  // ═══════════════════════════════════════════════════════════
  private module: Module | null = null;
  private moduleBackendId?: string;
  private isTransitioning: boolean = false;
  private backButton?: Phaser.GameObjects.Container;
  private minigameButton?: Phaser.GameObjects.Container;
  private lessonContainers: Phaser.GameObjects.Container[] = [];
  private roomHitZones: Phaser.GameObjects.Rectangle[] = [];
  private minigameShutdownHandler?: () => void;
  private resizeDebounceTimer?: Phaser.Time.TimerEvent;
  private transitionManager!: SceneTransitionManager;
  
  // Hover tooltip
  private hoverTooltip?: Phaser.GameObjects.Container;
  private hoverTooltipLessonId?: number;
  
  // Environment
  private lessonHouse?: Phaser.GameObjects.Image;
  
  // Bird character
  private bird?: BirdCharacter;

  // ═══════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════
  constructor() {
    super({ key: SCENE_KEYS.HOUSE });
  }

  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE METHODS
  // ═══════════════════════════════════════════════════════════
  init(data: HouseSceneData) {
    this.isTransitioning = false;
    this.lessonContainers = [];
    this.roomHitZones = [];
    this.hoverTooltip = undefined;
    this.hoverTooltipLessonId = undefined;
    this.moduleBackendId = data.moduleBackendId;
    
    const moduleLessonsData: Record<string, ModuleLessonsData> = this.registry.get('moduleLessonsData') || {};
    
    console.log('🏠 HouseScene init - moduleBackendId:', this.moduleBackendId);
    
    if (this.moduleBackendId && moduleLessonsData[this.moduleBackendId]) {
      this.module = moduleLessonsData[this.moduleBackendId];
      console.log('✅ Loaded module from backend:', this.module);
    } else {
      console.warn('⚠️ No module data found for backend ID:', this.moduleBackendId);
      this.module = {
        id: data.moduleId || 0,
        title: 'Loading...',
        lessons: []
      };
    }
    
    if (this.bird) {
      this.bird.destroy();
      this.bird = undefined;
    }
  }

  create() {
    super.create();
    this.transitionManager = new SceneTransitionManager(this);
    this.transitionManager.enterHouse();
    this.createEnvironment();
    this.createUI();
    this.createBirdWithEntrance();
    this.setupEventListeners()
    this.checkForLessonsUpdate();
  }

  shutdown() {
    super.shutdown();
    this.transitionManager.cleanup();
    
    if (this.minigameShutdownHandler) {
      const minigameScene = this.scene.get('GrowYourNestMinigame');
      if (minigameScene) {
        minigameScene.events.off('minigameCompleted', this.minigameShutdownHandler);
        this.minigameShutdownHandler = undefined;
      }
    }
    
    this.cleanupResizeHandler();
    this.destroyBird();
    this.destroyHoverTooltip();
    this.lessonContainers = [];
    this.roomHitZones = [];
  }

  // ═══════════════════════════════════════════════════════════
  // ENVIRONMENT CREATION METHODS
  // ═══════════════════════════════════════════════════════════
  private createEnvironment(): void {
    const { width, height } = this.scale;

    // Set background image on DOM element (like MapScene does)
    if (this.textures.exists(ASSET_KEYS.SUBURBAN_BACKGROUND)) {
      this.setBackgroundImage(ASSET_KEYS.SUBURBAN_BACKGROUND);
    } else {
      // Fallback: Set gradient background on DOM
      const bgElement = document.getElementById('section-background');
      if (bgElement) {
        bgElement.style.setProperty(
          'background', 
          'linear-gradient(133.93deg, #EEF1FF 24.22%, #FAFBFF 79%)', 
          'important'
        );
      }
    }

    // Layer 1 (depth 2): Lesson house image with transparent background
    this.lessonHouse = this.add.image(width / 2, height / 2, ASSET_KEYS.LESSON_HOUSE);
    this.lessonHouse.setDepth(1);
    const houseScale = Math.min(width, height) * 0.00121;
    this.lessonHouse.setScale(houseScale);
  }

  // ═══════════════════════════════════════════════════════════
  // UI CREATION METHODS
  // ═══════════════════════════════════════════════════════════
  private createUI(): void {
    this.createBackButton();
    this.createMinigameButton();
    
    if (this.module && this.module.lessons.length > 0) {
      this.createLessonCards();
      this.createRoomHitZones();
    } else {
      this.createLoadingPlaceholder();
    }
  }

  private createLoadingPlaceholder(): void {
    const { width, height } = this.scale;
    
    const loadingText = this.add.text(
      width / 2,
      height / 2,
      'Loading lessons...',
      createTextStyle('H2', COLORS.TEXT_SECONDARY, { 
        fontSize: scaleFontSize(24)
      })
    ).setOrigin(0.5);
    loadingText.setDepth(10);
  }

  private createBackButton(): void {
    this.backButton = ButtonBuilder.createBackButton(
      this,
      () => this.handleBackToNeighborhood()
    );
    this.backButton.setDepth(10);
  }

  private createMinigameButton(): void {
    const { width, height } = this.scale;

    // Position: below and to the right of coin counter
    const buttonX = width - (width * 0.08) + scale(20);
    const buttonY = height * 0.05 + scale(60);
    
    this.minigameButton = this.createCircularMinigameButton(buttonX, buttonY);
    this.minigameButton.setDepth(100);
  }

  private createCircularMinigameButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    const circleRadius = scale(24);
    
    const completedLessons = this.module?.lessons.filter(l => l.completed).length || 0;
    const totalLessons = this.module?.lessons.length || 0;
    let progressPercent = 0;
    
    if (totalLessons > 0 && completedLessons > 0) {
      progressPercent = (completedLessons / totalLessons) * 100;
    }
    
    // Background circle (light gray)
    const bgCircle = this.add.graphics();
    bgCircle.lineStyle(scale(4), COLORS.UNAVAILABLE_BUTTON, 1);
    bgCircle.strokeCircle(0, 0, circleRadius);
    container.add(bgCircle);
    
    // Progress arc (green)
    if (progressPercent > 0) {
      const progressArc = this.add.graphics();
      progressArc.lineStyle(scale(4), COLORS.STATUS_GREEN, 1);
      
      const startAngle = Phaser.Math.DegToRad(270);
      const endAngle = Phaser.Math.DegToRad(270 + (360 * progressPercent / 100));
      
      progressArc.beginPath();
      progressArc.arc(0, 0, circleRadius, startAngle, endAngle, false);
      progressArc.strokePath();
      container.add(progressArc);
    }
    
    // Determine tree stage (1-7)
    let treeStage: number;
    if (progressPercent === 0) {
      treeStage = 1;
    } else if (progressPercent === 100) {
      treeStage = 7;
    } else {
      treeStage = Math.floor((progressPercent / 100) * 5) + 2;
      treeStage = Math.min(treeStage, 6);
    }
    
    // Tree image
    const treeIcon = this.add.image(0, 0, `tree_stage_${treeStage}`);
    const targetSize = scale(42);
    const treeScale = targetSize / Math.max(treeIcon.width, treeIcon.height);
    treeIcon.setScale(treeScale);
    treeIcon.setOrigin(0.5);
    container.add(treeIcon);
    
    // Invisible hit area
    const hitArea = this.add.circle(0, 0, circleRadius + scale(5), 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);
    
    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scale: 1.1,
        duration: 200,
        ease: 'Power2'
      });
    });
    
    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 200,
        ease: 'Power2'
      });
    });
    
    hitArea.on('pointerdown', () => {
      this.handleMinigameSelect();
    });
    
    return container;
  }

  // ═══════════════════════════════════════════════════════════
  // LESSON CARDS (visual only — NO interactivity)
  // ═══════════════════════════════════════════════════════════
  private createLessonCards(): void {
    if (!this.module) return;

    this.module.lessons.forEach((lesson, index) => {
      this.createLessonCard(lesson, index);
    });
  }

  private createLessonCard(lesson: Lesson, index: number): void {
    const { width, height } = this.scale;

    const defaultPositions = [
      { x: 29, y: 32 },
      { x: 76.5, y: 31.5 },
      { x: 29, y: 70 },
      { x: 63, y: 70 },
    ];

    const defaultPos = defaultPositions[index] || { x: 50, y: 50 };

    const x = lesson.x !== undefined ? (lesson.x / 100) * width : (defaultPos.x / 100) * width;
    const y = lesson.y !== undefined ? (lesson.y / 100) * height : (defaultPos.y / 100) * height;

    const cardWidth = width * 0.24;
    const cardHeight = height * 0.175;

    const lessonContainer = this.add.container(x, y);
    lessonContainer.setDepth(10);
    this.lessonContainers.push(lessonContainer);

    const cardOffsetY = -cardHeight * 0.1;
    const card = this.add.rectangle(0, cardOffsetY, cardWidth, cardHeight, COLORS.PURE_WHITE, 0.7);
    const strokeWidth = Math.max(2, width * 0.002);
    card.setStrokeStyle(strokeWidth, COLORS.UNAVAILABLE_BUTTON);
    lessonContainer.add(card);

    const titleSize = Math.min(width, height) * 0.022;
    const titleOffsetY = -cardHeight * 0.3;
    
    const titleText = this.add.text(0, titleOffsetY, lesson.title,
      createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, {
        fontSize: `${titleSize}px`,
        align: 'center',
        wordWrap: { width: cardWidth * 0.9 },
      })
    ).setOrigin(0.5);
    lessonContainer.add(titleText);

    const typeSize = Math.min(width, height) * 0.016;
    const typeOffsetY = -cardHeight * 0.1;
    
    const typeText = this.add.text(0, typeOffsetY, lesson.type,
      createTextStyle('CAPTION', COLORS.TEXT_SECONDARY, {
        fontSize: `${typeSize}px`,
        align: 'center',
      })
    ).setOrigin(0.5);
    lessonContainer.add(typeText);

    if (lesson.locked) {
      const lockOverlay = this.add.rectangle(0, cardOffsetY, cardWidth, cardHeight, COLORS.UNAVAILABLE_BUTTON, 0.5);
      lessonContainer.add(lockOverlay);
    }

    this.createStatusBadge(lessonContainer, lesson, cardWidth, cardHeight);
    // NOTE: No interactivity added to lesson cards — they are visual only
  }

  private createStatusBadge(
    container: Phaser.GameObjects.Container, 
    lesson: Lesson,
    cardWidth: number,
    cardHeight: number
  ): void {
    const { width, height } = this.scale;
    
    const badgeSize = Math.min(width, height) * 0.025;
    const badgeX = cardWidth * 0.4;
    const badgeY = -cardHeight * 0.35;

    if (lesson.completed) {
      const completedBg = this.add.circle(badgeX, badgeY, badgeSize, COLORS.STATUS_GREEN);
      container.add(completedBg);
      
      const checkmark = this.add.text(badgeX, badgeY, '✓',
        createTextStyle('BADGE', COLORS.TEXT_WHITE_HEX, {
          fontSize: `${badgeSize * 1.2}px`
        })
      ).setOrigin(0.5);
      container.add(checkmark);
    } else if (lesson.locked) {
      const lockedBg = this.add.circle(badgeX, badgeY, badgeSize, COLORS.UNAVAILABLE_BUTTON);
      container.add(lockedBg);
      
      const lockIcon = this.add.text(badgeX, badgeY, '🔒',
        createTextStyle('BADGE', COLORS.TEXT_WHITE_HEX, {
          fontSize: `${badgeSize}px`
        })
      ).setOrigin(0.5);
      container.add(lockIcon);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ROOM QUADRANT HIT ZONES (transparent hover areas)
  // ═══════════════════════════════════════════════════════════
  private createRoomHitZones(): void {
    if (!this.module || !this.lessonHouse) return;

    const { width, height } = this.scale;

    // Get the actual rendered bounds of the house image
    const houseScale = this.lessonHouse.scaleX;
    const houseDisplayW = this.lessonHouse.width * houseScale;
    const houseDisplayH = this.lessonHouse.height * houseScale;
    const houseLeft = (width - houseDisplayW) / 2;
    const houseTop = (height - houseDisplayH) / 2;

    // The house is a 2x2 grid of rooms. The vertical center wall and 
    // horizontal floor divide it. These percentages are relative to the
    // house image bounds (approximated from the screenshot).
    //
    //  ┌────────────┬────────────┐
    //  │  Room 0    │  Room 1    │  top row: ~10% to ~54% of house height
    //  │ (top-left) │ (top-right)│
    //  ├────────────┼────────────┤
    //  │  Room 2    │  Room 3    │  bottom row: ~54% to ~100% of house height
    //  │ (bot-left) │ (bot-right)│
    //  └────────────┴────────────┘
    //
    // Left col: ~5% to ~50%, Right col: ~50% to ~95% of house width

    const roomQuadrants = [
      { left: 0.05, top: 0.10, right: 0.50, bottom: 0.54 },  // Room 0: top-left
      { left: 0.50, top: 0.10, right: 0.95, bottom: 0.54 },  // Room 1: top-right
      { left: 0.05, top: 0.54, right: 0.50, bottom: 1.00 },  // Room 2: bottom-left
      { left: 0.50, top: 0.54, right: 0.95, bottom: 1.00 },  // Room 3: bottom-right
    ];

    this.module.lessons.forEach((lesson, index) => {
      if (index >= roomQuadrants.length) return;

      const quad = roomQuadrants[index];
      const zoneX = houseLeft + (quad.left + quad.right) / 2 * houseDisplayW;
      const zoneY = houseTop + (quad.top + quad.bottom) / 2 * houseDisplayH;
      const zoneW = (quad.right - quad.left) * houseDisplayW;
      const zoneH = (quad.bottom - quad.top) * houseDisplayH;

      // Transparent rectangle covering the room quadrant
      const hitZone = this.add.rectangle(zoneX, zoneY, zoneW, zoneH, 0x000000, 0);
      hitZone.setDepth(15); // Above lesson cards (10) so it receives hover
      hitZone.setInteractive({ useHandCursor: !lesson.locked });
      this.roomHitZones.push(hitZone);

      hitZone.on('pointerover', () => {
        this.showHoverTooltip(lesson, zoneX, zoneY);
      });

      hitZone.on('pointerout', () => {
        this.destroyHoverTooltip();
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // HOVER TOOLTIP (appears anchored near the room quadrant)
  // ═══════════════════════════════════════════════════════════
  private showHoverTooltip(
    lesson: Lesson,
    zoneX: number,
    zoneY: number
  ): void {
    // If already showing for this lesson, skip
    if (this.hoverTooltipLessonId === lesson.id) return;

    // Destroy any existing tooltip
    this.destroyHoverTooltip();
    this.hoverTooltipLessonId = lesson.id;

    const { width, height } = this.scale;
    const minDim = Math.min(width, height);

    // ── Fixed tooltip dimensions ──
    const tooltipWidth = Math.min(width * 0.28, 320);
    const padding = scale(20);
    const innerWidth = tooltipWidth - padding * 2;
    const cornerRadius = scale(16);

    // ── Pre-calculate all font sizes ──
    const titleFontSize = minDim * 0.028;
    const descFontSize = minDim * 0.017;
    const btnFontSize = minDim * 0.018;
    const unlockFontSize = minDim * 0.014;
    const closeBtnSize = minDim * 0.022;

    // ── Fixed layout slots (top-down, all relative to tooltip top) ──
    const topPad = scale(16);
    const titleSlotY = topPad;
    const titleMaxH = titleFontSize * 2.4; // ~2 lines max
    const descSlotY = titleSlotY + titleMaxH + scale(8);
    const descMaxLines = 2;
    const descLineH = descFontSize * 1.35;
    const descMaxH = descMaxLines * descLineH;
    const btnSlotY = descSlotY + descMaxH + scale(14);
    const btnHeight = scale(36);
    const btnCornerRadius = btnHeight / 2;

    // For locked: add unlock message below button
    const unlockMsgH = lesson.locked ? unlockFontSize * 2.8 + scale(8) : 0;
    const bottomPad = scale(14);

    const tooltipHeight = btnSlotY + btnHeight + unlockMsgH + bottomPad;

    // ── Position: centered over the room quadrant, clamped to viewport ──
    let tooltipX = zoneX;
    let tooltipY = zoneY;

    const padX = tooltipWidth / 2 + scale(8);
    const padY = tooltipHeight / 2 + scale(8);
    if (tooltipX - padX < 0) tooltipX = padX;
    if (tooltipX + padX > width) tooltipX = width - padX;
    if (tooltipY - padY < 0) tooltipY = padY;
    if (tooltipY + padY > height) tooltipY = height - padY;

    this.hoverTooltip = this.add.container(tooltipX, tooltipY);
    this.hoverTooltip.setDepth(51);

    // All Y positions are relative to container center, so offset by half height
    const offsetY = -tooltipHeight / 2;

    // ── Card background ──
    const tooltipBg = this.add.graphics();
    tooltipBg.fillStyle(COLORS.PURE_WHITE, 1);
    tooltipBg.fillRoundedRect(
      -tooltipWidth / 2, offsetY, tooltipWidth, tooltipHeight, cornerRadius
    );
    tooltipBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON, 0.6);
    tooltipBg.strokeRoundedRect(
      -tooltipWidth / 2, offsetY, tooltipWidth, tooltipHeight, cornerRadius
    );
    this.hoverTooltip.add(tooltipBg);

    // ── Close (X) icon (visual decoration) ──
    const closeX = tooltipWidth / 2 - scale(16);
    const closeIconY = offsetY + scale(16);

    const closeBg = this.add.circle(closeX, closeIconY, closeBtnSize, COLORS.TEXT_BLUE_BLACK, 1);
    this.hoverTooltip.add(closeBg);

    const closeText = this.add.text(closeX, closeIconY, '✕',
      createTextStyle('BADGE', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${closeBtnSize}px`,
      })
    ).setOrigin(0.5);
    this.hoverTooltip.add(closeText);

    // ── Title (max ~2 lines, cropped if overflow) ──
    const titleY = offsetY + titleSlotY;
    const titleTextObj = this.add.text(0, titleY, lesson.title,
      createTextStyle('H2', COLORS.TEXT_PRIMARY, {
        fontSize: `${titleFontSize}px`,
        align: 'center',
        wordWrap: { width: innerWidth * 0.9 },
      })
    ).setOrigin(0.5, 0);
    if (titleTextObj.height > titleMaxH) {
      titleTextObj.setCrop(0, 0, titleTextObj.width, titleMaxH);
    }
    this.hoverTooltip.add(titleTextObj);

    // ── Description (max 2 lines, truncated with "...") ──
    const descAbsY = offsetY + descSlotY;
    const rawDesc = lesson.description || lesson.type || '';
    const truncatedDesc = this.truncateTextToFit(rawDesc, innerWidth * 0.85, descFontSize, descMaxLines);

    const tooltipDesc = this.add.text(0, descAbsY, truncatedDesc,
      createTextStyle('BODY_LIGHT', COLORS.TEXT_SECONDARY, {
        fontSize: `${descFontSize}px`,
        align: 'center',
        wordWrap: { width: innerWidth * 0.85 },
      })
    ).setOrigin(0.5, 0);
    if (tooltipDesc.height > descMaxH + 4) {
      tooltipDesc.setCrop(0, 0, tooltipDesc.width, descMaxH);
    }
    this.hoverTooltip.add(tooltipDesc);

    // ── Action Button (pill shape) ──
    const btnWidth = tooltipWidth * 0.5;
    const btnAbsY = offsetY + btnSlotY;
    const btnCenterY = btnAbsY + btnHeight / 2;

    if (lesson.locked) {
      const lockedBtnBg = this.add.graphics();
      lockedBtnBg.fillStyle(COLORS.ELEGANT_BLUE, 0.5);
      lockedBtnBg.fillRoundedRect(
        -btnWidth / 2, btnAbsY, btnWidth, btnHeight, btnCornerRadius
      );
      this.hoverTooltip.add(lockedBtnBg);

      const lockedBtnText = this.add.text(0, btnCenterY, 'Locked',
        createTextStyle('BODY_BOLD', COLORS.TEXT_SECONDARY, {
          fontSize: `${btnFontSize}px`,
        })
      ).setOrigin(0.5);
      this.hoverTooltip.add(lockedBtnText);

      // "Unlock this lesson..." message
      const unlockMsgY = btnAbsY + btnHeight + scale(8);
      const unlockMsg = this.add.text(0, unlockMsgY,
        'Unlock this lesson by watching\nthe previous lessons',
        createTextStyle('CAPTION', COLORS.TEXT_SECONDARY, {
          fontSize: `${unlockFontSize}px`,
          align: 'center',
        })
      ).setOrigin(0.5, 0);
      this.hoverTooltip.add(unlockMsg);
    } else {
      const activeBtnBg = this.add.graphics();
      activeBtnBg.fillStyle(COLORS.ELEGANT_BLUE, 1);
      activeBtnBg.fillRoundedRect(
        -btnWidth / 2, btnAbsY, btnWidth, btnHeight, btnCornerRadius
      );
      this.hoverTooltip.add(activeBtnBg);

      const btnLabel = lesson.completed ? 'Review Lesson' : 'Start Lesson';
      const activeBtnText = this.add.text(0, btnCenterY, btnLabel,
        createTextStyle('BODY_BOLD', COLORS.TEXT_PURE_WHITE, {
          fontSize: `${btnFontSize}px`,
        })
      ).setOrigin(0.5);
      this.hoverTooltip.add(activeBtnText);

      // Button hit area
      const btnHit = this.add.rectangle(0, btnCenterY, btnWidth, btnHeight, 0x000000, 0);
      btnHit.setInteractive({ useHandCursor: true });
      btnHit.on('pointerover', () => {
        activeBtnBg.clear();
        activeBtnBg.fillStyle(COLORS.LOGO_BLUE, 1);
        activeBtnBg.fillRoundedRect(
          -btnWidth / 2, btnAbsY, btnWidth, btnHeight, btnCornerRadius
        );
      });
      btnHit.on('pointerout', () => {
        activeBtnBg.clear();
        activeBtnBg.fillStyle(COLORS.ELEGANT_BLUE, 1);
        activeBtnBg.fillRoundedRect(
          -btnWidth / 2, btnAbsY, btnWidth, btnHeight, btnCornerRadius
        );
      });
      btnHit.on('pointerdown', () => {
        if (!this.isTransitioning) {
          this.handleLessonSelect(lesson);
        }
      });
      this.hoverTooltip.add(btnHit);
    }

    // ── Entrance animation ──
    this.hoverTooltip.setScale(0.9);
    this.hoverTooltip.setAlpha(0);

    this.tweens.add({
      targets: this.hoverTooltip,
      scale: 1,
      alpha: 1,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Truncate text to fit within a max number of lines.
   * Appends "..." if truncated.
   */
  private truncateTextToFit(
    text: string,
    maxWidth: number,
    fontSize: number,
    maxLines: number
  ): string {
    const charsPerLine = Math.floor(maxWidth / (fontSize * 0.55));
    const maxChars = charsPerLine * maxLines;

    if (text.length <= maxChars) return text;

    const truncated = text.substring(0, maxChars - 3).trimEnd();
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxChars * 0.5) {
      return truncated.substring(0, lastSpace) + '...';
    }
    return truncated + '...';
  }

  private destroyHoverTooltip(): void {
    if (this.hoverTooltip) {
      const tooltip = this.hoverTooltip;
      this.hoverTooltip = undefined;
      this.hoverTooltipLessonId = undefined;

      this.tweens.add({
        targets: tooltip,
        scale: 0.9,
        alpha: 0,
        duration: 120,
        ease: 'Power2',
        onComplete: () => {
          tooltip.destroy();
        }
      });
    } else {
      this.hoverTooltipLessonId = undefined;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  private handleBackToNeighborhood(): void {
    if (this.isTransitioning) return;

    const handleNeighborhoodSelect = this.registry.get('handleNeighborhoodSelect');
    if (handleNeighborhoodSelect) {
      this.isTransitioning = true;
      handleNeighborhoodSelect('downtown');
    }
  }

  private handleLessonSelect(lesson: Lesson): void {
    if (this.isTransitioning) return;

    const handleLessonSelect = this.registry.get('handleLessonSelect');
    if (handleLessonSelect) {
      this.isTransitioning = true;
      this.destroyHoverTooltip();
      handleLessonSelect(lesson.id, this.moduleBackendId || '');
    }
  }

  private handleMinigameSelect(): void {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    
    // Launch minigame FIRST (before sliding out)
    this.scene.launch('GrowYourNestMinigame');
    
    // Start sliding out HouseScene components immediately
    this.slideOutHouseComponents();
    
    // Pause this scene AFTER animations complete (not during)
    this.time.delayedCall(850, () => {
      this.scene.pause('HouseScene');
      
      const minigameScene = this.scene.get('GrowYourNestMinigame');
      if (minigameScene) {
        this.minigameShutdownHandler = () => {
          // Slide components back in when returning
          this.slideInHouseComponents();
          this.isTransitioning = false;
        };
        minigameScene.events.once('minigameCompleted', this.minigameShutdownHandler);
      }
    });
  }

  private slideOutHouseComponents(): void {
    const { width } = this.scale;
    const duration = 800;
    const ease = 'Power2';
    
    const allComponents: Phaser.GameObjects.GameObject[] = [];
    
    if (this.backButton) allComponents.push(this.backButton);
    
    const birdSprite = this.bird?.getSprite();
    if (birdSprite) allComponents.push(birdSprite);
    
    if (this.lessonHouse) allComponents.push(this.lessonHouse);
    
    this.lessonContainers.forEach(container => {
      if (container) allComponents.push(container);
    });

    this.roomHitZones.forEach(zone => {
      if (zone) allComponents.push(zone);
    });
    
    if (this.minigameButton) allComponents.push(this.minigameButton);
    
    const slideDistance = width * 1.5;
    
    allComponents.forEach(component => {
      this.tweens.add({
        targets: component,
        x: `-=${slideDistance}`,
        duration: duration,
        ease: ease
      });
    });
  }

  private slideInHouseComponents(): void {
    const { width } = this.scale;
    const duration = 800;
    const ease = 'Power2';
    
    const allComponents: Phaser.GameObjects.GameObject[] = [];
    
    if (this.backButton) allComponents.push(this.backButton);
    
    const birdSprite = this.bird?.getSprite();
    if (birdSprite) allComponents.push(birdSprite);
    
    if (this.lessonHouse) allComponents.push(this.lessonHouse);
    
    this.lessonContainers.forEach(container => {
      if (container) allComponents.push(container);
    });

    this.roomHitZones.forEach(zone => {
      if (zone) allComponents.push(zone);
    });
    
    if (this.minigameButton) allComponents.push(this.minigameButton);
    
    const slideDistance = width * 1.5;
    
    allComponents.forEach(component => {
      this.tweens.add({
        targets: component,
        x: `+=${slideDistance}`,
        duration: duration,
        ease: ease
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // BIRD CHARACTER METHODS
  // ═══════════════════════════════════════════════════════════
  private createBirdWithEntrance(): void {
    const { width, height } = this.scale;
    const birdTravelInfo: BirdTravelInfo | undefined = this.registry.get('birdTravelInfo');
    const returningFromLesson = this.registry.get('returningFromLesson');

    const finalX = width * 0.1;
    const finalY = height * 0.92;

    this.bird = new BirdCharacter(this);

    if (!birdTravelInfo || !birdTravelInfo.traveled || returningFromLesson) {
      this.bird.createStatic(finalX, finalY);
      this.bird.forceVisible();
      this.bird.startIdleAnimation();
      this.registry.set('returningFromLesson', false);
      return;
    }

    const comingFromLeft = birdTravelInfo.currentHouseIndex > birdTravelInfo.previousHouseIndex;

    this.bird.createWithFlyingEntrance(finalX, finalY, comingFromLeft, () => {
      this.bird!.startIdleAnimation();
    });

    this.registry.set('birdTravelInfo', undefined);
  }

  private destroyBird(): void {
    if (this.bird) {
      this.bird.destroy();
      this.bird = undefined;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RESIZE HANDLING  
  // ═══════════════════════════════════════════════════════════
  private setupEventListeners(): void {
    this.scale.on('resize', this.handleResizeDebounced, this);
    this.events.on('wake', this.reEnableButtons, this);
    this.events.on('resume', this.reEnableButtons, this);
  }

  private reEnableButtons(): void {
    console.log('🔄 Re-enabling buttons after resume');
    
    if (this.backButton && this.backButton.list.length > 0) {
      const interactiveZone = this.backButton.list[this.backButton.list.length - 1];
      if (interactiveZone && !interactiveZone.input) {
        interactiveZone.setInteractive({ useHandCursor: true });
      }
    }
    
    if (this.minigameButton && this.minigameButton.list.length > 0) {
      this.minigameButton.list.forEach(child => {
        if (child instanceof Phaser.GameObjects.Arc || child instanceof Phaser.GameObjects.Ellipse) {
          if (!child.input) {
            child.setInteractive({ useHandCursor: true });
          }
        }
      });
    }
    
    // Re-enable room hit zones
    this.roomHitZones.forEach((zone, index) => {
      if (zone && !zone.input) {
        const lesson = this.module?.lessons[index];
        zone.setInteractive({ useHandCursor: lesson ? !lesson.locked : false });
      }
    });
    
    this.isTransitioning = false;
    
    console.log('✅ Buttons re-enabled, isTransitioning:', this.isTransitioning);
  }

  private checkForLessonsUpdate(): void {
    if (this.moduleBackendId && (!this.module || this.module.lessons.length === 0)) {
      const moduleLessonsData: Record<string, ModuleLessonsData> = this.registry.get('moduleLessonsData') || {};
      
      if (moduleLessonsData[this.moduleBackendId]) {
        this.module = moduleLessonsData[this.moduleBackendId];
        console.log('✅ Loaded delayed module data:', this.module);
        
        this.lessonContainers.forEach(container => container.destroy());
        this.lessonContainers = [];
        this.roomHitZones.forEach(zone => zone.destroy());
        this.roomHitZones = [];
        this.createLessonCards();
        this.createRoomHitZones();
      }
    }
  }

  private handleResizeDebounced(): void {
    if (this.resizeDebounceTimer) {
      this.resizeDebounceTimer.remove();
    }
    
    this.resizeDebounceTimer = this.time.delayedCall(100, () => {
      this.handleResize();
      this.resizeDebounceTimer = undefined;
    });
  }

  private handleResize(): void {
    this.handleCoinCounterResize();

    if (this.backButton) {
      this.backButton.destroy();
    }
    this.createBackButton();

    if (this.minigameButton) {
      this.minigameButton.destroy();
    }
    this.createMinigameButton();

    // Destroy tooltip on resize
    this.destroyHoverTooltip();

    // Destroy and recreate lesson cards
    this.lessonContainers.forEach(container => container.destroy());
    this.lessonContainers = [];

    // Destroy and recreate room hit zones
    this.roomHitZones.forEach(zone => zone.destroy());
    this.roomHitZones = [];
    
    if (this.module && this.module.lessons.length > 0) {
      this.createLessonCards();
      this.createRoomHitZones();
    }

    if (this.lessonHouse) {
      const { width, height } = this.scale;
      this.lessonHouse.setPosition(width / 2, height / 2);
      const houseScale = Math.min(width, height) * 0.00121;
      this.lessonHouse.setScale(houseScale);
    }
  }

  private cleanupResizeHandler(): void {
    this.scale.off('resize', this.handleResizeDebounced, this);
    this.events.off('wake', this.reEnableButtons, this);
    this.events.off('resume', this.reEnableButtons, this);
    
    if (this.resizeDebounceTimer) {
      this.resizeDebounceTimer.remove();
      this.resizeDebounceTimer = undefined;
    }
  }
}