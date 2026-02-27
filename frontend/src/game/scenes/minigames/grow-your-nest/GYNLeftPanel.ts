import Phaser from 'phaser';
import { createTextStyle } from '../../../constants/Typography';
import { COLORS } from '../../../constants/Colors';
import { ASSET_KEYS } from '../../../constants/AssetKeys';
import type { GYNSceneState } from './GYNTypes';

// ═══════════════════════════════════════════════════════════════
// LEFT PANEL — Growth visualization, tree, progress bar
// ═══════════════════════════════════════════════════════════════

export function createLeftPanel(
  scene: Phaser.Scene,
  state: GYNSceneState,
  x: number,
  y: number,
  panelWidth: number,
  panelHeight: number
): void {
  state.leftPanel = scene.add.container(x, y);
  state.leftPanel.setDepth(5);

  state.leftPanel.setData('panelWidth', panelWidth);
  state.leftPanel.setData('panelHeight', panelHeight);

  // White panel background with rounded corners
  const panelBg = scene.add.graphics();
  panelBg.fillStyle(COLORS.PURE_WHITE, 0);
  panelBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
  const cornerRadius = 16;
  panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
  panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
  state.leftPanel.add(panelBg);

  // Background image
  if (scene.textures.exists(ASSET_KEYS.GROW_YOUR_NEST_BACKGROUND)) {
    state.leftPanelBackground = scene.add.image(
      panelWidth / 2,
      panelHeight / 2,
      ASSET_KEYS.GROW_YOUR_NEST_BACKGROUND
    );
    const scaleX = panelWidth / state.leftPanelBackground.width;
    const scaleY = panelHeight / state.leftPanelBackground.height;
    const scale = Math.max(scaleX, scaleY);
    state.leftPanelBackground.setScale(scale);

    const maskShape = scene.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(x, y, panelWidth, panelHeight, cornerRadius);
    const mask = maskShape.createGeometryMask();
    state.leftPanelBackground.setMask(mask);
    state.leftPanel.add(state.leftPanelBackground);
  }

  // Title removed per design update

  // Plant/tree graphics container — positioned lower to sit on ground area of background
  state.plantGraphics = scene.add.container(panelWidth / 2, panelHeight * 0.8);
  state.leftPanel.add(state.plantGraphics);

  createProgressSection(scene, state, panelWidth, panelHeight);

}

function createProgressSection(
  scene: Phaser.Scene,
  state: GYNSceneState,
  panelWidth: number,
  panelHeight: number
): void {
  const bottomY = panelHeight - 80;
  const leftMargin = 20;
  const rightMargin = 20;

  // Orange rounded container
  const containerWidth = panelWidth - leftMargin - rightMargin;
  const containerHeight = 96;
  const containerRadius = 24;
  const containerY = bottomY - containerHeight / 2;

  const orangeContainer = scene.add.graphics();
  orangeContainer.fillStyle(0xffa726, 1);
  orangeContainer.fillRoundedRect(leftMargin, containerY, containerWidth, containerHeight, containerRadius);
  state.leftPanel.add(orangeContainer);

  // Progress bar (light gray background)
  const progressBarStartX = leftMargin + 20;
  const progressBarWidth = containerWidth - 40;
  const progressBarHeight = 28;
  const progressBarRadius = 14;

  const progressBarBg = scene.add.graphics();
  progressBarBg.fillStyle(COLORS.PURE_WHITE, 1);
  progressBarBg.fillRoundedRect(
    progressBarStartX,
    bottomY - progressBarHeight / 2,
    progressBarWidth,
    progressBarHeight,
    progressBarRadius
  );
  state.leftPanel.add(progressBarBg);

  // Blue progress fill (starts empty)
  const progressBarFillGraphics = scene.add.graphics();
  state.leftPanel.add(progressBarFillGraphics);
  state.leftPanel.setData('progressBarFill', progressBarFillGraphics);
  state.leftPanel.setData('progressBarStartX', progressBarStartX);
  state.leftPanel.setData('progressBarY', bottomY - progressBarHeight / 2);
  state.leftPanel.setData('progressBarWidth', progressBarWidth);
  state.leftPanel.setData('progressBarHeight', progressBarHeight);
  state.leftPanel.setData('progressBarRadius', progressBarRadius);

  // Stage text — large, blue with white stroke
  const stageTextX = leftMargin + 10;
  const stageTextY = containerY - 10;
  state.stageText = scene.add.text(stageTextX, stageTextY, 'Stage 1', {
    fontFamily: 'Onest',
    fontSize: '48px',
    color: '#3658EC',
    align: 'center',
    fontStyle: 'bold',
    stroke: '#FFFFFF',
    strokeThickness: 3,
  });
  state.stageText.setOrigin(0, 0.5);
  state.leftPanel.add(state.stageText);

  // Progress percent text — right aligned
  const progressPercentTextX = panelWidth - rightMargin - 10;
  const progressPercentTextY = containerY - 10;
  state.progressPercentText = scene.add.text(progressPercentTextX, progressPercentTextY, '0%', {
    fontFamily: 'Onest',
    fontSize: '48px',
    color: '#3658EC',
    align: 'center',
    fontStyle: 'bold',
    stroke: '#FFFFFF',
    strokeThickness: 3,
  });
  state.progressPercentText.setOrigin(1, 0.5);
  state.leftPanel.add(state.progressPercentText);

  // Trigger initial plant growth
  updatePlantGrowth(scene, state);
}

// ═══════════════════════════════════════════════════════════════
// PLANT / TREE GROWTH
// ═══════════════════════════════════════════════════════════════

export function updatePlantGrowth(scene: Phaser.Scene, state: GYNSceneState): void {
  if (state.floatingTween) {
    state.floatingTween.stop();
    state.floatingTween = undefined;
  }

  state.plantGraphics.removeAll(true);

  // Stage calculation
  let stage: number;
  let progressPercent: number;

  if (state.treeState) {
    stage = state.treeState.current_stage + 1;
    if (stage > 5) stage = 5;
    if (stage < 1) stage = 1;

    // Progress within the current stage (not overall)
    const pointsPerStage = state.treeState.points_per_stage || 50;
    const pointsIntoCurrentStage = state.treeState.growth_points % pointsPerStage;
    // If tree is completed, show 100%
    if (state.treeState.completed) {
      progressPercent = 100;
    } else {
      progressPercent = (pointsIntoCurrentStage / pointsPerStage) * 100;
    }
  } else {
    stage = 1;
    progressPercent = 0;
  }

  console.log(`🌳 Tree stage: ${stage}, progress: ${progressPercent.toFixed(1)}%`);

  // Progressive scaling: Stage 1: 1.0x, Stage 7: 2.0x
  const stageScaleMultiplier = 1.0 + ((stage - 1) / 4) * 1.0;

  // Shadow — fixed position at tree base
  if (scene.textures.exists(ASSET_KEYS.TREE_SHADOW)) {
    const shadowYOffset = 10;
    const treeShadow = scene.add.image(0, shadowYOffset, ASSET_KEYS.TREE_SHADOW);
    const shadowBaseScale = 0.8 + ((stage - 1) / 4) * 0.7;
    treeShadow.setScale(shadowBaseScale);
    treeShadow.setAlpha(1);
    state.plantGraphics.add(treeShadow);

    scene.tweens.add({
      targets: treeShadow,
      scaleX: shadowBaseScale * 0.85,
      scaleY: shadowBaseScale * 0.85,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  // Tree image — anchored from bottom so tree grows upward across stages
  const treeKey = `tree_stage_${stage}`;
  if (scene.textures.exists(treeKey)) {
    const treeImage = scene.add.image(0, 0, treeKey);
    treeImage.setOrigin(0.5, 1); // anchor at bottom-center

    const maxTreeHeight = 350;
    const maxTreeWidth = 280;
    const scaleX = maxTreeWidth / treeImage.width;
    const scaleY = maxTreeHeight / treeImage.height;
    const baseScale = Math.min(scaleX, scaleY);
    const finalScale = baseScale * stageScaleMultiplier;

    treeImage.setScale(finalScale);
    state.plantGraphics.add(treeImage);

    // Wrap tree (and optionally bird-in-nest) in a sub-container so they float together
    const treeGroup = scene.add.container(0, 0);
    treeGroup.add(treeImage);

    // If tree is completed, overlay bird-in-nest on the tree center
    if (state.treeState?.completed && scene.textures.exists(ASSET_KEYS.BIRD_NEST_STANDING)) {
      const treeDisplayHeight = treeImage.height * finalScale;
      const birdY = -(treeDisplayHeight * 0.53);
      const birdX = treeDisplayHeight * 0.02;
      const birdNest = scene.add.image(birdX, birdY, ASSET_KEYS.BIRD_NEST_STANDING);
      const birdTargetHeight = treeDisplayHeight * 0.35;
      const birdScale = birdTargetHeight / birdNest.height;
      birdNest.setScale(birdScale);
      treeGroup.add(birdNest);
      state.birdNestImage = birdNest;
    }

    state.plantGraphics.add(treeGroup);

    state.floatingTween = scene.tweens.add({
      targets: treeGroup,
      y: -8,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  } else {
    // Fallback: emoji tree
    const treeSizes = ['🌱', '🌱', '🪴', '🌿', '🌳', '🌳', '🌲'];
    const emoji = treeSizes[stage - 1] || '🌱';
    const fontSize = 40 + stage * 15;
    const treeEmoji = scene.add.text(0, 0, emoji, { fontSize: `${fontSize}px` });
    treeEmoji.setOrigin(0.5, 0.5);
    state.plantGraphics.add(treeEmoji);
  }

 // Update stage text (display 1-indexed: backend stage 0 = display "Stage 1")
  if (state.stageText && state.stageText.scene) {
    try {
      const totalStages = state.treeState ? state.treeState.total_stages : 5;
      state.stageText.setText(`Stage ${stage}/${totalStages}`);
    } catch (e) {
      console.warn('⚠️ stageText.setText failed:', e);
    }
  }

  // Update progress percent text
  if (state.progressPercentText && state.progressPercentText.scene) {
    try {
      state.progressPercentText.setText(`${Math.round(progressPercent)}%`);
    } catch (e) {
      console.warn('⚠️ progressPercentText.setText failed:', e);
    }
  }

  // Update progress bar fill
  updateProgressBar(state, progressPercent);
}

/**
 * Adds the bird-in-nest image to the tree on the left panel.
 * Called when the tree fully grown screen is shown, even if treeState.completed
 * is not yet set (e.g. during testing). Skips if bird is already present.
 */
export function showBirdNestOnTree(scene: Phaser.Scene, state: GYNSceneState): void {
  if (state.birdNestImage) return; // already showing
  if (!scene.textures.exists(ASSET_KEYS.BIRD_NEST_STANDING)) return;

  // Find the tree group container inside plantGraphics
  const children = state.plantGraphics.getAll();
  // The tree group is the last container added (contains tree image + optionally bird)
  let treeGroup: Phaser.GameObjects.Container | null = null;
  for (let i = children.length - 1; i >= 0; i--) {
    if (children[i] instanceof Phaser.GameObjects.Container) {
      treeGroup = children[i] as Phaser.GameObjects.Container;
      break;
    }
  }

  if (!treeGroup) return;

  // Find the tree image inside the group to calculate positioning
  const treeImage = treeGroup.getAll().find(
    (child) => child instanceof Phaser.GameObjects.Image && (child as Phaser.GameObjects.Image).texture.key.startsWith('tree_stage_')
  ) as Phaser.GameObjects.Image | undefined;

  if (!treeImage) return;

  const treeDisplayHeight = treeImage.height * treeImage.scaleY;
  const birdY = -(treeDisplayHeight * 0.53);
  const birdX = treeDisplayHeight * 0.02;
  const birdNest = scene.add.image(birdX, birdY, ASSET_KEYS.BIRD_NEST_STANDING);
  const birdTargetHeight = treeDisplayHeight * 0.35;
  const birdScale = birdTargetHeight / birdNest.height;
  birdNest.setScale(birdScale);
  treeGroup.add(birdNest);
  state.birdNestImage = birdNest;
}

function updateProgressBar(state: GYNSceneState, progressPercent: number): void {
  const progressBarFillGraphics = state.leftPanel?.getData('progressBarFill') as Phaser.GameObjects.Graphics;
  const progressBarStartX = state.leftPanel?.getData('progressBarStartX') as number;
  const progressBarY = state.leftPanel?.getData('progressBarY') as number;
  const progressBarWidth = state.leftPanel?.getData('progressBarWidth') as number;
  const progressBarHeight = state.leftPanel?.getData('progressBarHeight') as number;
  const progressBarRadius = state.leftPanel?.getData('progressBarRadius') as number;

  if (progressBarFillGraphics) {
    progressBarFillGraphics.clear();

    const fillWidth = (progressPercent / 100) * progressBarWidth;

    if (fillWidth > 0) {
      progressBarFillGraphics.fillStyle(0x3f51b5, 1);
      progressBarFillGraphics.fillRoundedRect(
        progressBarStartX,
        progressBarY,
        fillWidth,
        progressBarHeight,
        progressBarRadius
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// WATERING ANIMATION
// ═══════════════════════════════════════════════════════════════

export function playWateringAnimation(
  scene: Phaser.Scene,
  state: GYNSceneState,
  onComplete?: () => void,
  alreadyAwarded?: boolean
): void {
  if (state.isWateringAnimationPlaying) return;

  if (!scene.textures.exists(ASSET_KEYS.WATERING_CAN_STILL)) {
    console.warn('⚠️ Watering can animation skipped: WATERING_CAN_STILL texture not loaded');
    if (onComplete) onComplete();
    return;
  }
  if (!scene.textures.exists(ASSET_KEYS.WATERING_CAN_POURING)) {
    console.warn('⚠️ Watering can animation skipped: WATERING_CAN_POURING texture not loaded');
    if (onComplete) onComplete();
    return;
  }

  console.log('🌊 Playing watering can animation!');
  state.isWateringAnimationPlaying = true;

  const panelWidth = state.leftPanel.getData('panelWidth') as number;
  const panelHeight = state.leftPanel.getData('panelHeight') as number;

  const startX = panelWidth * 0.75;
  const startY = panelHeight * 0.55;
  const pouringX = panelWidth * 0.68;
  const pouringY = panelHeight * 0.63;

  state.wateringCanImage = scene.add.image(startX, startY, ASSET_KEYS.WATERING_CAN_STILL);
  state.wateringCanImage.setScale(2.0);
  state.wateringCanImage.setAlpha(0);
  state.leftPanel.add(state.wateringCanImage);

  // Step 1: Fade in
  scene.tweens.add({
    targets: state.wateringCanImage,
    alpha: 1,
    duration: 300,
    ease: 'Power2',
    onComplete: () => {
      if (!state.wateringCanImage) return;

      // Step 2: Move to pouring position
      scene.tweens.add({
        targets: state.wateringCanImage,
        x: pouringX,
        y: pouringY,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          if (!state.wateringCanImage) return;

          // Step 3: Switch to pouring frame and tilt
          state.wateringCanImage.setTexture(ASSET_KEYS.WATERING_CAN_POURING);
          state.wateringCanImage.setAngle(15);

          // Show "+1 Water" or "Already Earned" text
          showWaterText(scene, state, pouringX, pouringY, panelWidth, alreadyAwarded);

          // Step 4: Hold pouring
          scene.time.delayedCall(1200, () => {
            if (!state.wateringCanImage) return;

            // Step 5: Straighten
            state.wateringCanImage.setTexture(ASSET_KEYS.WATERING_CAN_STILL);
            state.wateringCanImage.setAngle(0);

            // Step 6: Return
            scene.tweens.add({
              targets: state.wateringCanImage,
              x: startX,
              y: startY,
              duration: 400,
              ease: 'Power2',
              onComplete: () => {
                if (!state.wateringCanImage) return;

                // Step 7: Fade out
                scene.tweens.add({
                  targets: state.wateringCanImage,
                  alpha: 0,
                  duration: 300,
                  ease: 'Power2',
                  onComplete: () => {
                    if (state.wateringCanImage) {
                      state.wateringCanImage.destroy();
                      state.wateringCanImage = undefined;
                    }
                    state.isWateringAnimationPlaying = false;
                    console.log('✅ Watering can animation complete!');
                    if (onComplete) {
                      onComplete();
                    }
                  },
                });
              },
            });
          });
        },
      });
    },
  });
}

function showWaterText(
  scene: Phaser.Scene,
  state: GYNSceneState,
  x: number,
  y: number,
  panelWidth: number,
  alreadyAwarded?: boolean
): void {
  const fontSize = Math.round(panelWidth * 0.08);
  const displayText = alreadyAwarded ? 'Max Growth Points' : '+1 Water';
  const textColor = alreadyAwarded
    ? `#${COLORS.UNAVAILABLE_BUTTON.toString(16).padStart(6, '0')}`
    : `#${COLORS.LOGO_BLUE.toString(16).padStart(6, '0')}`;
  const waterText = scene.add.text(
    x - 175,
    y - 100,
    displayText,
    createTextStyle('BODY_BOLD', textColor, {
      fontSize: `${fontSize}px`,
    })
  );
  waterText.setOrigin(0.5, 0.5);
  waterText.setAlpha(0);
  waterText.setScale(0.5);
  state.leftPanel.add(waterText);

  scene.tweens.add({
    targets: waterText,
    alpha: 1,
    scale: 1.2,
    duration: 200,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: waterText,
        scale: 1,
        duration: 150,
        ease: 'Power2',
        onComplete: () => {
          scene.tweens.add({
            targets: waterText,
            y: y - 130,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            delay: 200,
            onComplete: () => {
              waterText.destroy();
            },
          });
        },
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// FERTILIZER ANIMATION
// ═══════════════════════════════════════════════════════════════

export function playFertilizerAnimation(
  scene: Phaser.Scene,
  state: GYNSceneState,
  onComplete?: () => void
): void {
  if (state.isFertilizerAnimationPlaying) return;

  if (!scene.textures.exists(ASSET_KEYS.FERTILIZER_STILL)) {
    console.warn('⚠️ Fertilizer animation skipped: FERTILIZER_STILL texture not loaded');
    if (onComplete) onComplete();
    return;
  }
  if (!scene.textures.exists(ASSET_KEYS.FERTILIZER_POURING)) {
    console.warn('⚠️ Fertilizer animation skipped: FERTILIZER_POURING texture not loaded');
    if (onComplete) onComplete();
    return;
  }

  console.log('🌿 Playing fertilizer animation!');
  state.isFertilizerAnimationPlaying = true;

  const panelWidth = state.leftPanel.getData('panelWidth') as number;
  const panelHeight = state.leftPanel.getData('panelHeight') as number;

  // Left side of the tree (mirrored from watering can which is on the right)
  const startX = panelWidth * 0.25;
  const startY = panelHeight * 0.73;
  const pouringX = panelWidth * 0.32;
  const pouringY = panelHeight * 0.75;

  state.fertilizerImage = scene.add.image(startX, startY, ASSET_KEYS.FERTILIZER_STILL);
  state.fertilizerImage.setScale(0.2);
  state.fertilizerImage.setAlpha(0);
  state.leftPanel.add(state.fertilizerImage);

  // Step 1: Fade in
  scene.tweens.add({
    targets: state.fertilizerImage,
    alpha: 1,
    duration: 300,
    ease: 'Power2',
    onComplete: () => {
      if (!state.fertilizerImage) return;

      // Step 2: Move to pouring position
      scene.tweens.add({
        targets: state.fertilizerImage,
        x: pouringX,
        y: pouringY,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          if (!state.fertilizerImage) return;

          // Step 3: Switch to pouring frame and tilt (opposite direction)
          state.fertilizerImage.setTexture(ASSET_KEYS.FERTILIZER_POURING);
          state.fertilizerImage.setAngle(-15);

          // Show "Fertilizer +20" text
          showFertilizerText(scene, state, pouringX, pouringY, panelWidth);

          // Step 4: Hold pouring
          scene.time.delayedCall(1200, () => {
            if (!state.fertilizerImage) return;

            // Step 5: Straighten
            state.fertilizerImage.setTexture(ASSET_KEYS.FERTILIZER_STILL);
            state.fertilizerImage.setAngle(0);

            // Step 6: Return
            scene.tweens.add({
              targets: state.fertilizerImage,
              x: startX,
              y: startY,
              duration: 400,
              ease: 'Power2',
              onComplete: () => {
                if (!state.fertilizerImage) return;

                // Step 7: Fade out
                scene.tweens.add({
                  targets: state.fertilizerImage,
                  alpha: 0,
                  duration: 300,
                  ease: 'Power2',
                  onComplete: () => {
                    if (state.fertilizerImage) {
                      state.fertilizerImage.destroy();
                      state.fertilizerImage = undefined;
                    }
                    state.isFertilizerAnimationPlaying = false;
                    console.log('✅ Fertilizer animation complete!');
                    if (onComplete) {
                      onComplete();
                    }
                  },
                });
              },
            });
          });
        },
      });
    },
  });
}

function showFertilizerText(
  scene: Phaser.Scene,
  state: GYNSceneState,
  x: number,
  y: number,
  panelWidth: number
): void {
  const fontSize = Math.round(panelWidth * 0.08);
  const fertilizerText = scene.add.text(
    x + 175,
    y - 100,
    'Fertilizer +20',
    createTextStyle('BODY_BOLD', `#${COLORS.STATUS_GREEN.toString(16).padStart(6, '0')}`, {
      fontSize: `${fontSize}px`,
    })
  );
  fertilizerText.setOrigin(0.5, 0.5);
  fertilizerText.setAlpha(0);
  fertilizerText.setScale(0.5);
  state.leftPanel.add(fertilizerText);

  scene.tweens.add({
    targets: fertilizerText,
    alpha: 1,
    scale: 1.2,
    duration: 200,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: fertilizerText,
        scale: 1,
        duration: 150,
        ease: 'Power2',
        onComplete: () => {
          scene.tweens.add({
            targets: fertilizerText,
            y: y - 130,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            delay: 200,
            onComplete: () => {
              fertilizerText.destroy();
            },
          });
        },
      });
    },
  });
}