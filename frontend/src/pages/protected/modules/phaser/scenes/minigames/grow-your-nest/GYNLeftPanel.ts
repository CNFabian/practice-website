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
  panelBg.fillStyle(COLORS.PURE_WHITE, 1);
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

  // "Growth" title
  const title = scene.add.text(
    panelWidth / 2,
    40,
    'Growth',
    createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: '36px' })
  );
  title.setOrigin(0.5, 0);
  state.leftPanel.add(title);

  // Plant/tree graphics container
  state.plantGraphics = scene.add.container(panelWidth / 2, panelHeight / 2 + 20);
  state.leftPanel.add(state.plantGraphics);

  // Delay progress section creation to ensure fonts are loaded
  scene.time.delayedCall(100, () => {
    createProgressSection(scene, state, panelWidth, panelHeight);
  });
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
  progressBarBg.fillStyle(0xe0e0e0, 1);
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

  if (state.gameMode !== 'legacy' && state.treeState) {
    stage = state.treeState.current_stage + 1;
    if (stage > 7) stage = 7;
    if (stage < 1) stage = 1;
    progressPercent =
      (state.treeState.growth_points /
        (state.treeState.total_stages * state.treeState.points_per_stage)) *
      100;
  } else {
    const totalQuestions = state.questions.length;
    const correctAnswers = state.score;

    if (correctAnswers === 0) {
      stage = 1;
    } else if (correctAnswers === totalQuestions) {
      stage = 7;
    } else {
      const pct = correctAnswers / totalQuestions;
      stage = Math.floor(pct * 5) + 2;
      stage = Math.min(stage, 6);
    }
    progressPercent = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  }

  console.log(`🌳 Tree stage: ${stage}, progress: ${progressPercent.toFixed(1)}%`);

  // Progressive scaling: Stage 1: 1.0x, Stage 7: 2.0x
  const stageScaleMultiplier = 1.0 + ((stage - 1) / 6) * 1.0;

  // Shadow
  if (scene.textures.exists(ASSET_KEYS.TREE_SHADOW)) {
    const shadowYOffset = 200 + (stage - 1) * 30;
    const treeShadow = scene.add.image(0, shadowYOffset, ASSET_KEYS.TREE_SHADOW);
    const shadowBaseScale = 0.8 + ((stage - 1) / 6) * 0.7;
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

  // Tree image
  const treeKey = `tree_stage_${stage}`;
  if (scene.textures.exists(treeKey)) {
    const treeImage = scene.add.image(0, 0, treeKey);

    const maxTreeHeight = 350;
    const maxTreeWidth = 280;
    const scaleX = maxTreeWidth / treeImage.width;
    const scaleY = maxTreeHeight / treeImage.height;
    const baseScale = Math.min(scaleX, scaleY);
    const finalScale = baseScale * stageScaleMultiplier;

    treeImage.setScale(finalScale);
    state.plantGraphics.add(treeImage);

    state.floatingTween = scene.tweens.add({
      targets: treeImage,
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

  // Update stage text
  if (state.stageText) {
    if (state.gameMode !== 'legacy' && state.treeState) {
      state.stageText.setText(`Stage ${state.treeState.current_stage}`);
    } else {
      state.stageText.setText(`Stage ${stage}`);
    }
  }

  // Update progress percent text
  if (state.progressPercentText) {
    state.progressPercentText.setText(`${Math.round(progressPercent)}%`);
  }

  // Update progress bar fill
  updateProgressBar(state, progressPercent);
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
  onComplete?: () => void
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

  const startX = panelWidth * 0.7;
  const startY = panelHeight * 0.45;
  const pouringX = panelWidth * 0.65;
  const pouringY = panelHeight * 0.5;

  state.wateringCanImage = scene.add.image(startX, startY, ASSET_KEYS.WATERING_CAN_STILL);
  state.wateringCanImage.setScale(1.5);
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

          // Show "+1 Water" text
          showWaterText(scene, state, pouringX, pouringY, panelWidth);

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
  panelWidth: number
): void {
  const fontSize = Math.round(panelWidth * 0.08);
  const waterText = scene.add.text(
    x - 175,
    y - 100,
    '+1 Water',
    createTextStyle('BODY_BOLD', `#${COLORS.LOGO_BLUE.toString(16).padStart(6, '0')}`, {
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