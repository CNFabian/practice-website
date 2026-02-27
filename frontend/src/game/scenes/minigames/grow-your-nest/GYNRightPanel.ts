/* eslint-disable no-useless-assignment */
import Phaser from 'phaser';
import { createTextStyle } from '../../../constants/Typography';
import { COLORS } from '../../../constants/Colors';
import type { GYNSceneState } from './GYNTypes';
import { showBirdNestOnTree } from './GYNLeftPanel';

// ═══════════════════════════════════════════════════════════════
// RIGHT PANEL — Questions, start screen, completion
// ═══════════════════════════════════════════════════════════════

export function createRightPanel(
  scene: Phaser.Scene,
  state: GYNSceneState,
  x: number,
  y: number,
  panelWidth: number,
  panelHeight: number,
  callbacks: {
    onAnswerSelection: (letter: string) => void;
    onNext: () => void;
    onReturn: () => void;
    onStartGame?: () => void;
  }
): void {
  state.rightPanel = scene.add.container(x, y);
  state.rightPanel.setDepth(5);

  const panelBg = scene.add.graphics();
  panelBg.fillStyle(COLORS.PURE_WHITE, 1);
  panelBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
  const cornerRadius = 16;
  panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
  panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
  state.rightPanel.add(panelBg);

  const HORIZONTAL_PADDING = panelWidth * 0.08;
  const topSeparatorY = 90;
  const bottomSeparatorY = panelHeight - panelHeight * 0.14;

  const title = scene.add.text(
    HORIZONTAL_PADDING,
    topSeparatorY / 2,
    'Question Cards',
    createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: '24px' })
  );
  title.setOrigin(0, 0.5);
  state.rightPanel.add(title);

  // Persistent separator lines (indices 2 and 3 — preserved by all clear functions)
  const topSeparator = scene.add.graphics();
  topSeparator.lineStyle(1, COLORS.UNAVAILABLE_BUTTON, 0.5);
  topSeparator.lineBetween(0, topSeparatorY, panelWidth, topSeparatorY);
  state.rightPanel.add(topSeparator);

  const bottomSeparator = scene.add.graphics();
  bottomSeparator.lineStyle(1, COLORS.UNAVAILABLE_BUTTON, 0.5);
  bottomSeparator.lineBetween(0, bottomSeparatorY, panelWidth, bottomSeparatorY);
  state.rightPanel.add(bottomSeparator);

  state.rightPanel.setData('panelWidth', panelWidth);
  state.rightPanel.setData('panelHeight', panelHeight);
  state.rightPanel.setData('topSeparatorY', topSeparatorY);
  state.rightPanel.setData('bottomSeparatorY', bottomSeparatorY);

  if (state.showingStartScreen) {
    showStartScreen(scene, state, callbacks);
  } else if (state.currentQuestionIndex >= state.questions.length && state.lessonPassed !== null) {
    // All questions answered and results received — re-show completion on resize
    showCompletion(scene, state, callbacks.onReturn);
  } else {
    updateQuestion(scene, state, callbacks);
  }
}

// ═══════════════════════════════════════════════════════════════
// START SCREEN
// ═══════════════════════════════════════════════════════════════

export function showStartScreen(
  scene: Phaser.Scene,
  state: GYNSceneState,
  callbacks: {
    onAnswerSelection: (letter: string) => void;
    onNext: () => void;
    onReturn: () => void;
    onStartGame?: () => void;
  }
): void {
  const panelWidth = state.rightPanel.getData('panelWidth') as number;
  const panelHeight = state.rightPanel.getData('panelHeight') as number;
  const HORIZONTAL_PADDING = panelWidth * 0.08;
  const contentWidth = panelWidth - HORIZONTAL_PADDING * 2;

  // Bird illustration — use the same bird_with_pencil image as the login page
  const birdTargetHeight = panelHeight * 0.24;
  const birdY = panelHeight * 0.25;

  let birdGraphic: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
  if (scene.textures.exists('bird_with_pencil')) {
    birdGraphic = scene.add.image(panelWidth / 2, birdY, 'bird_with_pencil');
    // Scale proportionally based on height, preserving native aspect ratio
    const nativeHeight = (birdGraphic as Phaser.GameObjects.Image).height;
    const scaleFactor = birdTargetHeight / nativeHeight;
    (birdGraphic as Phaser.GameObjects.Image).setScale(scaleFactor);
  } else if (scene.textures.exists('bird_celebration')) {
    birdGraphic = scene.add.image(panelWidth / 2, birdY, 'bird_celebration');
    const nativeHeight = (birdGraphic as Phaser.GameObjects.Image).height;
    const scaleFactor = birdTargetHeight / nativeHeight;
    (birdGraphic as Phaser.GameObjects.Image).setScale(scaleFactor);
  } else {
    birdGraphic = scene.add.graphics();
    (birdGraphic as Phaser.GameObjects.Graphics).fillStyle(COLORS.ELEGANT_BLUE, 0.3);
    (birdGraphic as Phaser.GameObjects.Graphics).fillCircle(panelWidth / 2, birdY, birdTargetHeight / 2);
  }
  state.rightPanel.add(birdGraphic);

  if (!scene.textures.exists('bird_with_pencil') && !scene.textures.exists('bird_celebration')) {
    const birdEmoji = scene.add.text(panelWidth / 2, birdY, '🐦', {
      fontSize: `${birdTargetHeight * 0.6}px`,
    });
    birdEmoji.setOrigin(0.5, 0.5);
    state.rightPanel.add(birdEmoji);
  }

  // ── Coin reward badge (compute size first so we can position description between bird and badge) ──
  const coinReward = state.treeState ? state.treeState.total_stages * 50 : 250;
  const badgePaddingRight = panelWidth * 0.10;
  const badgePaddingV = panelHeight * 0.032;
  const badgeFontSize = Math.round(panelWidth * 0.032);
  const coinSize = badgeFontSize * 2;
  const iconSpace = coinSize + panelWidth * 0.03;
  const badgePaddingLeft = panelWidth * 0.06 + iconSpace;

  const badgeText = scene.add.text(
    0,
    0,
    `Complete this tree\nto earn: ${coinReward} Coins`,
    createTextStyle('BODY_MEDIUM', COLORS.TEXT_PURE_WHITE, {
      fontSize: `${badgeFontSize}px`,
      align: 'center',
      lineSpacing: badgeFontSize * 0.35,
    })
  );
  badgeText.setOrigin(0.5, 0.5);

  const badgeWidth = badgeText.width + badgePaddingLeft + badgePaddingRight;
  const badgeHeight = badgeText.height + badgePaddingV * 2;
  const badgeCornerRadius = 14;

  // Shift text right to account for asymmetric padding (icon on left)
  const textOffsetX = (badgePaddingLeft - badgePaddingRight) / 2;
  badgeText.x = textOffsetX;

  // Create Linear Blue 1 gradient background via canvas
  const badgeGradientKey = `gyn_badge_gradient_${Math.round(badgeWidth)}_${Math.round(badgeHeight)}`;
  if (!scene.textures.exists(badgeGradientKey)) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(badgeWidth);
    canvas.height = Math.ceil(badgeHeight);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Linear Blue 1: 180deg (top to bottom), #1D3CC6 → #837CFF
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1D3CC6');
      gradient.addColorStop(1, '#837CFF');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(badgeCornerRadius, 0);
      ctx.lineTo(canvas.width - badgeCornerRadius, 0);
      ctx.quadraticCurveTo(canvas.width, 0, canvas.width, badgeCornerRadius);
      ctx.lineTo(canvas.width, canvas.height - badgeCornerRadius);
      ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - badgeCornerRadius, canvas.height);
      ctx.lineTo(badgeCornerRadius, canvas.height);
      ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - badgeCornerRadius);
      ctx.lineTo(0, badgeCornerRadius);
      ctx.quadraticCurveTo(0, 0, badgeCornerRadius, 0);
      ctx.closePath();
      ctx.fill();
    }
    scene.textures.addCanvas(badgeGradientKey, canvas);
  }

  const badgeBgImage = scene.add.image(0, 0, badgeGradientKey);
  badgeBgImage.setDisplaySize(badgeWidth, badgeHeight);

  // Coin icon — positioned inside left padding area
  let coinIcon: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  const iconX = -badgeWidth / 2 + panelWidth * 0.04 + coinSize / 2;
  if (scene.textures.exists('coinIcon')) {
    coinIcon = scene.add.image(iconX, 0, 'coinIcon');
    (coinIcon as Phaser.GameObjects.Image).setDisplaySize(coinSize, coinSize);
  } else {
    coinIcon = scene.add.text(iconX, 0, '🪙', {
      fontSize: `${coinSize}px`,
    });
    (coinIcon as Phaser.GameObjects.Text).setOrigin(0.5, 0.5);
  }

  // Use persistent bottom separator Y from panel data
  const bottomSeparatorY = state.rightPanel.getData('bottomSeparatorY') as number;

  // Position badge above the separator with some breathing room
  const badgeY = bottomSeparatorY - badgeHeight / 2 - panelHeight * 0.06;

  // Position description text centered between bird bottom and badge top
  const birdBottom = birdY + birdTargetHeight / 2;
  const badgeTop = badgeY - badgeHeight / 2;
  const descriptionY = (birdBottom + badgeTop) / 2;
  const descriptionFontSize = Math.round(panelWidth * 0.048);
  const descriptionText = `Answer questions to earn water and fertilizer to grow your tree of Module ${state.moduleNumber}!`;

  const description = scene.add.text(
    panelWidth / 2,
    descriptionY,
    descriptionText,
    createTextStyle('BODY_LIGHT', COLORS.TEXT_PRIMARY, {
      fontSize: `${descriptionFontSize}px`,
      align: 'center',
      wordWrap: { width: contentWidth },
      lineSpacing: descriptionFontSize * 0.4,
    })
  );
  description.setOrigin(0.5, 0.5);
  state.rightPanel.add(description);

  const badgeContainer = scene.add.container(panelWidth / 2, badgeY);
  badgeContainer.add(badgeBgImage);
  badgeContainer.add(coinIcon);
  badgeContainer.add(badgeText);
  state.rightPanel.add(badgeContainer);

  // Two buttons side by side — right-aligned, smaller, fully rounded
  // Vertically centered between separator line and panel bottom
  const buttonsY = (bottomSeparatorY + panelHeight) / 2;
  const buttonHeight = panelHeight * 0.065;
  const buttonRadius = buttonHeight / 2;
  const buttonGap = panelWidth * 0.025;
  const goButtonWidth = panelWidth * 0.28;
  const laterButtonWidth = panelWidth * 0.28;

  // Position from the right edge inward
  const goButtonX = panelWidth - HORIZONTAL_PADDING - goButtonWidth;
  const laterButtonX = goButtonX - buttonGap - laterButtonWidth;

  // "DO IT LATER" button
  const laterButton = createStartScreenButton(
    scene,
    laterButtonX,
    buttonsY,
    laterButtonWidth,
    buttonHeight,
    buttonRadius,
    'DO IT LATER',
    false,
    () => {
      callbacks.onReturn();
    }
  );
  state.rightPanel.add(laterButton);

  // "LET'S GO" button
  const goButton = createStartScreenButton(
    scene,
    goButtonX,
    buttonsY,
    goButtonWidth,
    buttonHeight,
    buttonRadius,
    "LET'S GO",
    true,
    () => {
      if (callbacks.onStartGame) {
        callbacks.onStartGame();
      } else {
        clearStartScreen(state);
        state.showingStartScreen = false;
        updateQuestion(scene, state, callbacks);
      }
    }
  );
  state.rightPanel.add(goButton);
}

function createStartScreenButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  text: string,
  isPrimary: boolean,
  onClick: () => void
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);

  const bg = scene.add.graphics();
  if (isPrimary) {
    bg.fillStyle(COLORS.ELEGANT_BLUE, 1);
    bg.fillRoundedRect(0, -height / 2, width, height, radius);
  } else {
    bg.fillStyle(COLORS.PURE_WHITE, 1);
    bg.fillRoundedRect(0, -height / 2, width, height, radius);
    bg.lineStyle(1.5, COLORS.ELEGANT_BLUE, 1);
    bg.strokeRoundedRect(0, -height / 2, width, height, radius);
  }
  container.add(bg);

  const fontSize = Math.round(width * 0.085);
  const textColor = isPrimary ? COLORS.TEXT_PURE_WHITE : '#6B85F5';
  const buttonText = scene.add.text(
    width / 2,
    0,
    text,
    createTextStyle('BUTTON', textColor, { fontSize: `${fontSize}px` })
  );
  buttonText.setOrigin(0.5, 0.5);
  container.add(buttonText);

  const hitArea = scene.add.rectangle(width / 2, 0, width, height, 0x000000, 0);
  hitArea.setInteractive({ useHandCursor: true });
  container.setData('bg', bg);
  container.setData('text', buttonText);
  container.setData('width', width);
  container.setData('height', height);
  container.setData('radius', radius);
  container.setData('isPrimary', isPrimary);
  container.setData('hitArea', hitArea);

  hitArea.on('pointerover', () => {
    bg.clear();
    if (isPrimary) {
      bg.fillStyle(COLORS.ELEGANT_BLUE, 0.85);
      bg.fillRoundedRect(0, -height / 2, width, height, radius);
    } else {
      bg.fillStyle(COLORS.LIGHT_BACKGROUND_BLUE, 1);
      bg.fillRoundedRect(0, -height / 2, width, height, radius);
      bg.lineStyle(1.5, COLORS.ELEGANT_BLUE, 1);
      bg.strokeRoundedRect(0, -height / 2, width, height, radius);
    }
  });
  hitArea.on('pointerout', () => {
    bg.clear();
    if (isPrimary) {
      bg.fillStyle(COLORS.ELEGANT_BLUE, 1);
      bg.fillRoundedRect(0, -height / 2, width, height, radius);
    } else {
      bg.fillStyle(COLORS.PURE_WHITE, 1);
      bg.fillRoundedRect(0, -height / 2, width, height, radius);
      bg.lineStyle(1.5, COLORS.ELEGANT_BLUE, 1);
      bg.strokeRoundedRect(0, -height / 2, width, height, radius);
    }
  });
  hitArea.on('pointerdown', onClick);

  container.add(hitArea);
  container.sendToBack(hitArea);

  return container;
}

export function clearStartScreen(state: GYNSceneState): void {
  const children = state.rightPanel.getAll();
  for (let i = children.length - 1; i >= 4; i--) {
    const child = children[i];
    if (child instanceof Phaser.GameObjects.Container) {
      const hitArea = child.getData('hitArea') as Phaser.GameObjects.Rectangle;
      if (hitArea && hitArea.input) {
        hitArea.removeAllListeners();
        hitArea.disableInteractive();
      }
    }
    child.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// QUESTION VIEW
// ═══════════════════════════════════════════════════════════════

export function updateQuestion(
  scene: Phaser.Scene,
  state: GYNSceneState,
  callbacks: {
    onAnswerSelection: (letter: string) => void;
    onNext: () => void;
    onReturn: () => void;
  }
): void {
  if (state.currentQuestionIndex >= state.questions.length) {
    // All questions answered — don't trigger onNext here as this may be
    // called from a resize/re-render. The main scene handles completion
    // via handleNextQuestion after the last answer.
    return;
  }

  const question = state.questions[state.currentQuestionIndex];
  const panelWidth = state.rightPanel.getData('panelWidth') as number;
  const panelHeight = state.rightPanel.getData('panelHeight') as number;

  // Clean up old option buttons
  state.optionButtons.forEach((btn) => {
    const hitArea = btn.getData('hitArea') as Phaser.GameObjects.Rectangle;
    if (hitArea && hitArea.input) {
      hitArea.removeAllListeners();
      hitArea.disableInteractive();
    }
    btn.destroy();
  });
  state.optionButtons = [];

  if (state.questionText) state.questionText.destroy();
  if (state.questionNumber) state.questionNumber.destroy();
  if (state.nextButton) {
    const hitArea = state.nextButton.getAt(3) as Phaser.GameObjects.Rectangle;
    if (hitArea && hitArea.input) {
      hitArea.removeAllListeners();
      hitArea.disableInteractive();
    }
    state.nextButton.destroy();
  }

  // Clear any existing feedback banner
  clearFeedbackBanner(state);

  const HORIZONTAL_PADDING_PERCENT = 0.08;
  const horizontalPadding = panelWidth * HORIZONTAL_PADDING_PERCENT;
  const contentWidth = panelWidth - horizontalPadding * 2;

  const topSeparatorY = state.rightPanel.getData('topSeparatorY') as number;
  const QUESTION_TO_OPTIONS_GAP_PERCENT = 0.12;
  const OPTION_BUTTON_HEIGHT_PERCENT = 0.095;
  const OPTION_GAP_PERCENT = 0.02;
  const NEXT_BUTTON_MARGIN_PERCENT = 0.08;
  const QUESTION_TEXT_FONT_PERCENT = 0.04;
  const OPTION_LETTER_FONT_PERCENT = 0.035;
  const OPTION_TEXT_FONT_PERCENT = 0.03;

  const questionStartY = topSeparatorY + 64;
  const questionToOptionsGap = panelHeight * QUESTION_TO_OPTIONS_GAP_PERCENT;
  const optionButtonHeight = panelHeight * OPTION_BUTTON_HEIGHT_PERCENT;
  const optionGap = panelHeight * OPTION_GAP_PERCENT;
  const nextButtonMargin = panelHeight * NEXT_BUTTON_MARGIN_PERCENT;
  const questionTextFontSize = Math.round(panelWidth * QUESTION_TEXT_FONT_PERCENT);
  const optionLetterFontSize = Math.round(panelWidth * OPTION_LETTER_FONT_PERCENT);
  const optionTextFontSize = Math.round(panelWidth * OPTION_TEXT_FONT_PERCENT);

  const fullQuestionText = state.gameMode === 'freeroam'
    ? question.question
    : `${state.currentQuestionIndex + 1}. ${question.question}`;  state.questionText = scene.add.text(
    horizontalPadding,
    questionStartY,
    fullQuestionText,
    createTextStyle('BODY_MEDIUM', COLORS.TEXT_PRIMARY, {
      fontSize: `${questionTextFontSize}px`,
      wordWrap: { width: contentWidth },
      lineSpacing: questionTextFontSize * 0.4,
    })
  );
  state.questionText.setOrigin(0, 0);
  state.rightPanel.add(state.questionText);
  state.questionNumber = state.questionText;

  const optionsStartY =
    questionStartY + state.questionText.height + questionToOptionsGap;

  question.options.forEach((option, index) => {
    const optionY = optionsStartY + index * (optionButtonHeight + optionGap);
    const optionContainer = createOptionButton(
      scene,
      option,
      optionY,
      horizontalPadding,
      contentWidth,
      optionButtonHeight,
      optionLetterFontSize,
      optionTextFontSize,
      callbacks.onAnswerSelection
    );
    state.optionButtons.push(optionContainer);
    state.rightPanel.add(optionContainer);
  });

  // Next button
  const nextButtonX = panelWidth - horizontalPadding - panelWidth * 0.13;
  const nextButtonY = panelHeight - nextButtonMargin;
  createNextButton(scene, state, nextButtonX, nextButtonY, panelWidth, callbacks.onNext);
  state.rightPanel.add(state.nextButton);
}

// ═══════════════════════════════════════════════════════════════
// OPTION BUTTON
// ═══════════════════════════════════════════════════════════════

function createOptionButton(
  scene: Phaser.Scene,
  option: { letter: string; text: string },
  y: number,
  leftPadding: number,
  buttonWidth: number,
  buttonHeight: number,
  letterFontSize: number,
  textFontSize: number,
  onSelect: (letter: string) => void
): Phaser.GameObjects.Container {
  const container = scene.add.container(0, y);

  const buttonBg = scene.add.graphics();
  buttonBg.fillStyle(COLORS.ELEGANT_BLUE, 0.2);
  buttonBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
  const cornerRadius = buttonHeight * 0.2;
  buttonBg.fillRoundedRect(
    leftPadding,
    -buttonHeight / 2,
    buttonWidth,
    buttonHeight,
    cornerRadius
  );
  buttonBg.strokeRoundedRect(
    leftPadding,
    -buttonHeight / 2,
    buttonWidth,
    buttonHeight,
    cornerRadius
  );
  container.add(buttonBg);

  const buttonHitArea = scene.add.rectangle(
    leftPadding + buttonWidth / 2,
    0,
    buttonWidth,
    buttonHeight,
    0x000000,
    0
  );

  const letterPaddingLeft = buttonWidth * 0.05;
  const letterText = scene.add.text(
    leftPadding + letterPaddingLeft,
    0,
    `${option.letter}.`,
    createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, {
      fontSize: `${letterFontSize}px`,
    })
  );
  letterText.setOrigin(0, 0.5);

  const optionTextPaddingLeft = buttonWidth * 0.15;
  const optionText = scene.add.text(
    leftPadding + optionTextPaddingLeft,
    0,
    option.text,
    createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY, {
      fontSize: `${textFontSize}px`,
      wordWrap: { width: buttonWidth * 0.8 },
    })
  );
  optionText.setOrigin(0, 0.5);

  container.add([letterText, optionText, buttonHitArea]);

  container.setData('letter', option.letter);
  container.setData('bg', buttonBg);
  container.setData('hitArea', buttonHitArea);
  container.setData('leftPadding', leftPadding);
  container.setData('buttonWidth', buttonWidth);
  container.setData('buttonHeight', buttonHeight);
  container.setData('cornerRadius', cornerRadius);

  // Live selection tracker — updated by showAnswerSelected() via setData
  container.setData('currentSelectedAnswer', null);

  buttonHitArea.setInteractive({ useHandCursor: true });

  buttonHitArea.on('pointerdown', () => onSelect(option.letter));

  buttonHitArea.on('pointerover', () => {
    // Read live selection from container data (not stale closure)
    const currentSelected = container.getData('currentSelectedAnswer') as string | null;
    if (currentSelected !== option.letter) {
      buttonBg.clear();
      buttonBg.fillStyle(COLORS.ELEGANT_BLUE, 0.3);
      buttonBg.lineStyle(2, COLORS.ELEGANT_BLUE);
      buttonBg.fillRoundedRect(
        leftPadding,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        cornerRadius
      );
      buttonBg.strokeRoundedRect(
        leftPadding,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        cornerRadius
      );
    }
  });

  buttonHitArea.on('pointerout', () => {
    // Read live selection from container data (not stale closure)
    const currentSelected = container.getData('currentSelectedAnswer') as string | null;
    if (currentSelected === option.letter) {
      // This is the selected option — restore selected style
      buttonBg.clear();
      buttonBg.fillStyle(COLORS.ELEGANT_BLUE, 0.2);
      buttonBg.lineStyle(2, COLORS.LINEAR_BLUE_1_START);
      buttonBg.fillRoundedRect(
        leftPadding,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        cornerRadius
      );
      buttonBg.strokeRoundedRect(
        leftPadding,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        cornerRadius
      );
    } else if (currentSelected !== null) {
      // Another option is selected — restore unselected style
      buttonBg.clear();
      buttonBg.fillStyle(COLORS.TEXT_WHITE, 1);
      buttonBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
      buttonBg.fillRoundedRect(
        leftPadding,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        cornerRadius
      );
      buttonBg.strokeRoundedRect(
        leftPadding,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        cornerRadius
      );
    } else {
      // Nothing selected — restore default style
      buttonBg.clear();
      buttonBg.fillStyle(COLORS.ELEGANT_BLUE, 0.2);
      buttonBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
      buttonBg.fillRoundedRect(
        leftPadding,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        cornerRadius
      );
      buttonBg.strokeRoundedRect(
        leftPadding,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        cornerRadius
      );
    }
  });

  return container;
}

// ═══════════════════════════════════════════════════════════════
// NEXT BUTTON
// ═══════════════════════════════════════════════════════════════

function createNextButton(
  scene: Phaser.Scene,
  state: GYNSceneState,
  x: number,
  y: number,
  panelWidth: number,
  onNext: () => void
): void {
  state.nextButton = scene.add.container(x, y);

  const buttonWidth = panelWidth * 0.24;
  const buttonHeight = panelWidth * 0.08;
  const borderRadius = buttonHeight / 2;
  const fontSize = Math.round(panelWidth * 0.035);

  const buttonBg = scene.add.graphics();
  buttonBg.fillStyle(COLORS.UNAVAILABLE_BUTTON);
  buttonBg.fillRoundedRect(
    -buttonWidth / 2,
    -buttonHeight / 2,
    buttonWidth,
    buttonHeight,
    borderRadius
  );

  const buttonText = scene.add.text(
    0,
    0,
    'NEXT',
    createTextStyle('BUTTON', COLORS.TEXT_SECONDARY, {
      fontSize: `${fontSize}px`,
    })
  );
  buttonText.setOrigin(0.5, 0.5);

  state.nextButton.add([buttonBg, buttonText]);

  state.nextButton.setData('bg', buttonBg);
  state.nextButton.setData('text', buttonText);
  state.nextButton.setData('enabled', false);
  state.nextButton.setData('buttonWidth', buttonWidth);
  state.nextButton.setData('buttonHeight', buttonHeight);
  state.nextButton.setData('borderRadius', borderRadius);

  const hitArea = scene.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x000000, 0);
  hitArea.setInteractive({ useHandCursor: true });

  hitArea.on('pointerdown', () => {
    if (!state.nextButton.getData('enabled')) return;
    onNext();
  });

  state.nextButton.add(hitArea);
  state.nextButton.sendToBack(hitArea);
}

export function updateNextButton(state: GYNSceneState, enabled: boolean): void {
  const bg = state.nextButton.getData('bg') as Phaser.GameObjects.Graphics;
  const text = state.nextButton.getData('text') as Phaser.GameObjects.Text;
  const buttonWidth = state.nextButton.getData('buttonWidth') as number;
  const buttonHeight = state.nextButton.getData('buttonHeight') as number;
  const borderRadius = state.nextButton.getData('borderRadius') as number;

  state.nextButton.setData('enabled', enabled);

  bg.clear();
  if (enabled) {
    bg.fillStyle(COLORS.ELEGANT_BLUE);
    bg.fillRoundedRect(
      -buttonWidth / 2,
      -buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      borderRadius
    );
    text.setColor(COLORS.TEXT_PURE_WHITE);
  } else {
    bg.fillStyle(COLORS.UNAVAILABLE_BUTTON);
    bg.fillRoundedRect(
      -buttonWidth / 2,
      -buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      borderRadius
    );
    text.setColor(COLORS.TEXT_SECONDARY);
  }
}

// ═══════════════════════════════════════════════════════════════
// FEEDBACK TEXT — inline text below bottom separator line
// ═══════════════════════════════════════════════════════════════

export function showFeedbackBanner(
  scene: Phaser.Scene,
  state: GYNSceneState,
  isCorrect: boolean,
  explanation?: string,
  correctLetter?: string
): void {
  // Clear any existing feedback first
  clearFeedbackBanner(state);

  const panelWidth = state.rightPanel.getData('panelWidth') as number;
  const panelHeight = state.rightPanel.getData('panelHeight') as number;
  const HORIZONTAL_PADDING = panelWidth * 0.08;

  if (isCorrect) {
    // ── Correct answer: green rounded modal below the last option button ──
    const contentWidth = panelWidth - HORIZONTAL_PADDING * 2;
    const modalHeight = panelHeight * 0.075;
    const modalRadius = modalHeight / 2;
    const fontSize = Math.round(panelWidth * 0.035);

    // Find the Y position of the last option button
    let modalY: number;
    if (state.optionButtons.length > 0) {
      const lastBtn = state.optionButtons[state.optionButtons.length - 1];
      const lastBtnHeight = lastBtn.getData('buttonHeight') as number;
      modalY = lastBtn.y + lastBtnHeight / 2 + panelHeight * 0.025;
    } else {
      modalY = panelHeight * 0.7;
    }

    state.feedbackBanner = scene.add.container(0, modalY);

    // Green gradient rounded pill background (StatusGreenBackground gradient)
    const gradKey = '__gyn_correct_pill_grad';
    if (scene.textures.exists(gradKey)) scene.textures.remove(gradKey);
    const canvas = scene.textures.createCanvas(gradKey, contentWidth, modalHeight);
    const ctx = canvas.context;
    // Draw rounded rect with gradient
    const grd = ctx.createLinearGradient(0, 0, 0, modalHeight);
    grd.addColorStop(0, '#339D5F');
    grd.addColorStop(1, '#32A68E');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(modalRadius, 0);
    ctx.lineTo(contentWidth - modalRadius, 0);
    ctx.quadraticCurveTo(contentWidth, 0, contentWidth, modalRadius);
    ctx.lineTo(contentWidth, modalHeight - modalRadius);
    ctx.quadraticCurveTo(contentWidth, modalHeight, contentWidth - modalRadius, modalHeight);
    ctx.lineTo(modalRadius, modalHeight);
    ctx.quadraticCurveTo(0, modalHeight, 0, modalHeight - modalRadius);
    ctx.lineTo(0, modalRadius);
    ctx.quadraticCurveTo(0, 0, modalRadius, 0);
    ctx.closePath();
    ctx.fill();
    canvas.refresh();
    const modalBg = scene.add.image(HORIZONTAL_PADDING, 0, gradKey);
    modalBg.setOrigin(0, 0);
    state.feedbackBanner.add(modalBg);

    // "correct!" text centered in the modal
    const correctText = scene.add.text(
      panelWidth / 2,
      modalHeight / 2,
      'correct!',
      createTextStyle('BODY_BOLD', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${fontSize}px`,
      })
    );
    correctText.setOrigin(0.5, 0.5);
    state.feedbackBanner.add(correctText);

    state.rightPanel.add(state.feedbackBanner);

    // Subtle fade-in animation
    state.feedbackBanner.setAlpha(0);
    scene.tweens.add({
      targets: state.feedbackBanner,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });
  } else {
    // ── Incorrect answer: text below the bottom separator ──
    const FEEDBACK_LEFT_PADDING = panelWidth * 0.04;
    const originalBottomSepY = state.rightPanel.getData('bottomSeparatorY') as number;
    const hardBottom = panelHeight - panelHeight * 0.02;
    const nextButtonWidth = panelWidth * 0.24;
    const textMaxWidth = panelWidth - FEEDBACK_LEFT_PADDING - nextButtonWidth - panelWidth * 0.08;
    const separatorToTextGap = panelHeight * 0.025;

    state.feedbackBanner = scene.add.container(0, 0);
    let totalContentHeight = 0;

    const headerFontSize = Math.round(panelWidth * 0.026);
    const headerLine = correctLetter
      ? `Nice try! The correct answer is ${correctLetter}`
      : 'Nice try!';
    const headerText = scene.add.text(
      FEEDBACK_LEFT_PADDING,
      0,
      headerLine,
      createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, {
        fontSize: `${headerFontSize}px`,
        wordWrap: { width: textMaxWidth },
      })
    );
    headerText.setOrigin(0, 0);
    state.feedbackBanner.add(headerText);
    totalContentHeight = headerText.height;

    if (explanation) {
      const explFontSize = Math.round(panelWidth * 0.022);
      const explGap = panelHeight * 0.012;
      const explText = scene.add.text(
        FEEDBACK_LEFT_PADDING,
        headerText.height + explGap,
        `Explanation: ${explanation}`,
        createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY, {
          fontSize: `${explFontSize}px`,
          wordWrap: { width: textMaxWidth },
          lineSpacing: explFontSize * 0.3,
        })
      );
      explText.setOrigin(0, 0);
      state.feedbackBanner.add(explText);
      totalContentHeight = headerText.height + explGap + explText.height;
    }

    // Calculate where the bottom separator needs to be
    const requiredSpace = separatorToTextGap + totalContentHeight;
    const availableSpace = hardBottom - originalBottomSepY;

    let actualBottomSepY = originalBottomSepY;
    if (requiredSpace > availableSpace) {
      actualBottomSepY = hardBottom - requiredSpace;
    }

    if (actualBottomSepY !== originalBottomSepY) {
      const bottomSeparator = state.rightPanel.getAt(3) as Phaser.GameObjects.Graphics;
      bottomSeparator.clear();
      bottomSeparator.lineStyle(1, COLORS.UNAVAILABLE_BUTTON, 0.5);
      bottomSeparator.lineBetween(0, actualBottomSepY, panelWidth, actualBottomSepY);
      state.rightPanel.setData('currentBottomSepY', actualBottomSepY);
    }

    const textStartY = actualBottomSepY + separatorToTextGap;
    state.feedbackBanner.setPosition(0, textStartY);
    state.rightPanel.add(state.feedbackBanner);

    state.feedbackBanner.setAlpha(0);
    scene.tweens.add({
      targets: state.feedbackBanner,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// EARNED REWARDS ROW — bottom-left "Great Job! Earned ___"
// ═══════════════════════════════════════════════════════════════

export function showEarnedRewardsRow(
  scene: Phaser.Scene,
  state: GYNSceneState,
  earnedText: string
): void {
  clearEarnedRewardsRow(state);

  const panelWidth = state.rightPanel.getData('panelWidth') as number;
  const panelHeight = state.rightPanel.getData('panelHeight') as number;
  const bottomSepY = state.rightPanel.getData('bottomSeparatorY') as number;
  const HORIZONTAL_PADDING = panelWidth * 0.04;

  // Position vertically centered between bottom separator and panel bottom
  const rowY = (bottomSepY + panelHeight) / 2;

  state.earnedRewardsRow = scene.add.container(HORIZONTAL_PADDING, rowY);

  // Green checkmark circle
  const checkCircleRadius = panelWidth * 0.022;
  const checkCircle = scene.add.graphics();
  checkCircle.fillStyle(COLORS.STATUS_GREEN, 1);
  checkCircle.fillCircle(checkCircleRadius, 0, checkCircleRadius);
  state.earnedRewardsRow.add(checkCircle);

  // White checkmark inside the circle
  const checkFontSize = Math.round(checkCircleRadius * 1.4);
  const checkMark = scene.add.text(
    checkCircleRadius,
    0,
    '✓',
    createTextStyle('BODY_BOLD', COLORS.TEXT_PURE_WHITE, {
      fontSize: `${checkFontSize}px`,
    })
  );
  checkMark.setOrigin(0.5, 0.5);
  state.earnedRewardsRow.add(checkMark);

  // "Great Job! Earned ___" text
  const textX = checkCircleRadius * 2 + panelWidth * 0.02;
  const textFontSize = Math.round(panelWidth * 0.024);
  const rewardsText = scene.add.text(
    textX,
    0,
    `Great Job! Earned ${earnedText}`,
    createTextStyle('BODY_MEDIUM', COLORS.TEXT_PRIMARY, {
      fontSize: `${textFontSize}px`,
    })
  );
  rewardsText.setOrigin(0, 0.5);

  // Make "Earned ___" part bold by using rich text approach —
  // Since Phaser doesn't support inline bold easily, we'll use two text objects
  rewardsText.destroy();

  const prefixText = scene.add.text(
    textX,
    0,
    'Great Job! Earned ',
    createTextStyle('BODY_MEDIUM', COLORS.TEXT_PRIMARY, {
      fontSize: `${textFontSize}px`,
    })
  );
  prefixText.setOrigin(0, 0.5);
  state.earnedRewardsRow.add(prefixText);

  const boldEarnedText = scene.add.text(
    textX + prefixText.width,
    0,
    earnedText,
    createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, {
      fontSize: `${textFontSize}px`,
    })
  );
  boldEarnedText.setOrigin(0, 0.5);
  state.earnedRewardsRow.add(boldEarnedText);

  state.rightPanel.add(state.earnedRewardsRow);

  // Subtle fade-in animation
  state.earnedRewardsRow.setAlpha(0);
  scene.tweens.add({
    targets: state.earnedRewardsRow,
    alpha: 1,
    duration: 300,
    ease: 'Power2',
  });
}

export function clearEarnedRewardsRow(state: GYNSceneState): void {
  if (state.earnedRewardsRow) {
    state.earnedRewardsRow.destroy();
    state.earnedRewardsRow = undefined;
  }
}

export function clearFeedbackBanner(state: GYNSceneState): void {
  // Also clear earned rewards row when clearing feedback
  clearEarnedRewardsRow(state);

  if (state.feedbackBanner) {
    state.feedbackBanner.destroy();
    state.feedbackBanner = undefined;

    // Restore the bottom separator to its original position if it was moved
    const currentBottomSepY = state.rightPanel.getData('currentBottomSepY') as number | undefined;
    if (currentBottomSepY !== undefined) {
      const panelWidth = state.rightPanel.getData('panelWidth') as number;
      const originalBottomSepY = state.rightPanel.getData('bottomSeparatorY') as number;
      const bottomSeparator = state.rightPanel.getAt(3) as Phaser.GameObjects.Graphics;
      bottomSeparator.clear();
      bottomSeparator.lineStyle(1, COLORS.UNAVAILABLE_BUTTON, 0.5);
      bottomSeparator.lineBetween(0, originalBottomSepY, panelWidth, originalBottomSepY);
      state.rightPanel.setData('currentBottomSepY', undefined);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// COMPLETION SCREEN
// ═══════════════════════════════════════════════════════════════

export function showCompletion(
  scene: Phaser.Scene,
  state: GYNSceneState,
  onReturn: () => void
): void {
  const panelWidth = state.rightPanel.getData('panelWidth') as number;
  const panelHeight = state.rightPanel.getData('panelHeight') as number;

  // Preserve persistent children: [0] panelBg, [1] title, [2] topSeparator, [3] bottomSeparator
  const children = state.rightPanel.getAll();
  children.slice(4).forEach((child) => child.destroy());

  // Clear feedback banner and earned rewards references since we just destroyed everything
  state.feedbackBanner = undefined;
  state.earnedRewardsRow = undefined;

  const HORIZONTAL_PADDING_PERCENT = 0.08;
  const horizontalPadding = panelWidth * HORIZONTAL_PADDING_PERCENT;
  const contentWidth = panelWidth - horizontalPadding * 2;
  const moduleButtonFontSize = Math.round(panelWidth * 0.034);

  // Determine if this was a failed lesson attempt
  const isLessonFailed = state.gameMode === 'lesson' && state.lessonPassed === false;

  const bottomSeparatorY = state.rightPanel.getData('bottomSeparatorY') as number;

  if (isLessonFailed) {
    // ═══════════════════════════════════════════════════════════
    // LESSON FAILED — Clean card with sad bird, message, and play again button
    // Only persistent elements remain: panelBg, "Question Cards" title, top & bottom separators
    // ═══════════════════════════════════════════════════════════

    const topSeparatorY = state.rightPanel.getData('topSeparatorY') as number;

    // Available content area is between top separator and bottom separator
    const contentAreaTop = topSeparatorY;
    const contentAreaBottom = bottomSeparatorY;
    const contentAreaHeight = contentAreaBottom - contentAreaTop;

    // ── Sad bird image ──
    const birdTargetHeight = panelHeight * 0.24;
    const birdY = contentAreaTop + contentAreaHeight * 0.30;

    if (scene.textures.exists('bird_sad')) {
      const bird = scene.add.image(panelWidth / 2, birdY, 'bird_sad');
      const nativeHeight = bird.height;
      const scaleFactor = birdTargetHeight / nativeHeight;
      bird.setScale(scaleFactor);
      state.rightPanel.add(bird);
    }

    // ── Headline text ──
    const headlineFontSize = Math.round(panelWidth * 0.055);
    const headlineY = birdY + birdTargetHeight / 2 + panelHeight * 0.05;
    const headlineText = scene.add.text(
      panelWidth / 2,
      headlineY,
      'Your tree needs a little\nmore care',
      createTextStyle('H2', COLORS.TEXT_PRIMARY, {
        fontSize: `${headlineFontSize}px`,
        align: 'center',
        lineSpacing: 6,
      })
    );
    headlineText.setOrigin(0.5, 0);
    state.rightPanel.add(headlineText);

    // ── Subtitle text ──
    const subtitleFontSize = Math.round(panelWidth * 0.03);
    const subtitleY = headlineY + headlineText.height + panelHeight * 0.03;
    const subtitleText = scene.add.text(
      panelWidth / 2,
      subtitleY,
      'You didn\'t earn enough growth this time.\nPlay again to continue growing your tree.',
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY, {
        fontSize: `${subtitleFontSize}px`,
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: contentWidth * 0.85 },
      })
    );
    subtitleText.setOrigin(0.5, 0);
    state.rightPanel.add(subtitleText);

    // ── Option B: Nest Coins pill — show even on fail if tree stage increased ──
    const currentStageOnFail = state.treeState?.current_stage ?? 0;
    const stageIncreasedOnFail = currentStageOnFail > state.initialTreeStage;
    const coinsEarnedOnFail = state.totalCoinsEarned;

    if (stageIncreasedOnFail) {
      const coinPillHeight = panelHeight * 0.06;
      const coinPillRadius = coinPillHeight / 2;
      const coinPillFontSize = Math.round(panelWidth * 0.028);
      const coinIconSize = coinPillHeight * 0.8;
      const coinPillY = subtitleY + subtitleText.height + panelHeight * 0.03;

      const coinPillContainer = scene.add.container(0, coinPillY);
      const coinPillGap = panelWidth * 0.01;
      const coinPillPadding = panelWidth * 0.02;

      const coinLabel = scene.add.text(
        0, 0,
        `You earned ${coinsEarnedOnFail} Nest Coins!`,
        createTextStyle('BODY_BOLD', COLORS.TEXT_PURE_WHITE, {
          fontSize: `${coinPillFontSize}px`,
        })
      );
      const textW = coinLabel.width;

      const coinPillWidth = coinPillPadding + textW + coinPillGap + coinIconSize + coinPillPadding;
      const coinPillX = (panelWidth - coinPillWidth) / 2;

      const coinPillBg = scene.add.graphics();
      coinPillBg.fillStyle(COLORS.LINEAR_BLUE_1_START, 1);
      coinPillBg.fillRoundedRect(coinPillX, 0, coinPillWidth, coinPillHeight, coinPillRadius);
      coinPillContainer.add(coinPillBg);

      const contentStartX = coinPillX + coinPillPadding;
      coinLabel.setPosition(contentStartX, coinPillHeight / 2);
      coinLabel.setOrigin(0, 0.5);
      coinPillContainer.add(coinLabel);

      if (scene.textures.exists('coinIcon')) {
        const coinIcon = scene.add.image(
          contentStartX + textW + coinPillGap,
          coinPillHeight / 2,
          'coinIcon'
        );
        coinIcon.setDisplaySize(coinIconSize, coinIconSize);
        coinIcon.setOrigin(0, 0.5);
        coinPillContainer.add(coinIcon);
      }

      state.rightPanel.add(coinPillContainer);
    }

    // ── PLAY AGAIN button — positioned in the bottom section below the separator ──
    const bottomSectionMidY = bottomSeparatorY + (panelHeight - bottomSeparatorY) / 2;
    const playAgainButtonWidth = panelWidth * 0.24;
    const playAgainButtonHeight = panelWidth * 0.08;
    const playAgainButtonRadius = playAgainButtonHeight / 2;

    const playAgainContainer = scene.add.container(
      panelWidth - horizontalPadding - playAgainButtonWidth / 2,
      bottomSectionMidY
    );

    const playAgainBg = scene.add.graphics();
    playAgainBg.fillStyle(COLORS.ELEGANT_BLUE);
    playAgainBg.fillRoundedRect(
      -playAgainButtonWidth / 2,
      -playAgainButtonHeight / 2,
      playAgainButtonWidth,
      playAgainButtonHeight,
      playAgainButtonRadius
    );

    const playAgainText = scene.add.text(
      0,
      0,
      'PLAY AGAIN',
      createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${moduleButtonFontSize}px`,
      })
    );
    playAgainText.setOrigin(0.5, 0.5);

    playAgainContainer.add([playAgainBg, playAgainText]);

    const playAgainHitArea = scene.add.rectangle(
      0, 0, playAgainButtonWidth, playAgainButtonHeight, 0x000000, 0
    );
    playAgainHitArea.setInteractive({ useHandCursor: true });
    playAgainHitArea.on('pointerdown', () => {
      // Capture data before stopping the scene — closures referencing
      // scene state will be invalidated once shutdown runs.
      const gyn = scene as any;

      const restartData = {
        mode: 'lesson' as const,
        lessonId: gyn.lessonId,
        moduleId: gyn.moduleId,
        questions: state.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options.map((o) => ({ ...o })),
          correctAnswerId: null,
          explanation: q.explanation || '',
        })),
        treeState: state.treeState ? { ...state.treeState } : undefined,
        moduleNumber: gyn.moduleNumber || 1,
        showStartScreen: false,
        awardedQuestionIds: Array.from(gyn.awardedQuestionIds || []),
      };

      if (!restartData.lessonId || !restartData.moduleId) return;

      const houseScene = scene.scene.get('HouseScene');

      // Ensure HouseScene is active — resume only works on paused scenes,
      // but HouseScene may be sleeping (from the LessonView launch path).
      // Handle all states so the relaunch works correctly.
      if (houseScene) {
        if (scene.scene.isSleeping('HouseScene')) {
          scene.scene.wake('HouseScene');
        } else if (scene.scene.isPaused('HouseScene')) {
          scene.scene.resume('HouseScene');
        }
      }

      scene.scene.stop('GrowYourNestMinigame');

      // Use setTimeout instead of houseScene.time.delayedCall — the Phaser
      // timer only ticks when the scene's update loop is running, and
      // HouseScene may not be in an actively-updating state. setTimeout
      // fires reliably regardless of scene state.
      //
      // IMPORTANT: We must use houseScene.scene.launch() (HouseScene's
      // ScenePlugin), NOT the GYN scene's ScenePlugin. Phaser's
      // ScenePlugin.launch() has a guard: `if (key !== this.key)` — it
      // silently refuses to launch a scene with the same key as its owner.
      // Since the GYN ScenePlugin's key is 'GrowYourNestMinigame', calling
      // gynScenePlugin.launch('GrowYourNestMinigame') is a no-op.
      setTimeout(() => {
        if (!houseScene || !houseScene.scene) return; // game was destroyed

        houseScene.scene.launch('GrowYourNestMinigame', restartData);
        houseScene.scene.pause('HouseScene');

        const newScene = houseScene.scene.get('GrowYourNestMinigame');
        const hs = houseScene as any;
        if (newScene && hs.minigameShutdownHandler) {
          newScene.events.once('minigameCompleted', hs.minigameShutdownHandler);
        }
      }, 50);
    });
    playAgainContainer.add(playAgainHitArea);
    playAgainContainer.sendToBack(playAgainHitArea);
    state.rightPanel.add(playAgainContainer);
  } else {
    // ═══════════════════════════════════════════════════════════
    // LESSON PASSED / FREE ROAM — Clean completion screen
    // Only persistent elements remain: panelBg, "Question Cards" title, top & bottom separators
    // ═══════════════════════════════════════════════════════════

    const topSeparatorY = state.rightPanel.getData('topSeparatorY') as number;
    const contentAreaTop = topSeparatorY;
    const contentAreaBottom = bottomSeparatorY;
    const contentAreaHeight = contentAreaBottom - contentAreaTop;

    // Determine if tree stage increased this session (Option B)
    const currentStage = state.treeState?.current_stage ?? 0;
    const stageIncreased = currentStage > state.initialTreeStage;
    const coinsEarned = state.totalCoinsEarned;

    // ── Bird with coin image ──
    const birdTargetHeight = panelHeight * 0.26;
    const birdY = contentAreaTop + contentAreaHeight * 0.22;

    if (scene.textures.exists('bird_with_coin')) {
      const bird = scene.add.image(panelWidth / 2, birdY, 'bird_with_coin');
      const nativeHeight = bird.height;
      const scaleFactor = birdTargetHeight / nativeHeight;
      bird.setScale(scaleFactor);
      state.rightPanel.add(bird);
    } else if (scene.textures.exists('bird_celebration')) {
      // Fallback to celebration bird
      const bird = scene.add.image(panelWidth / 2, birdY, 'bird_celebration');
      const nativeHeight = bird.height;
      const scaleFactor = birdTargetHeight / nativeHeight;
      bird.setScale(scaleFactor);
      state.rightPanel.add(bird);
    }

    // ── "Question Completed!" headline — lighter weight ──
    const headlineFontSize = Math.round(panelWidth * 0.055);
    const headlineY = birdY + birdTargetHeight / 2 + panelHeight * 0.04;
    const headlineText = scene.add.text(
      panelWidth / 2,
      headlineY,
      'Question Completed!',
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_PRIMARY, {
        fontSize: `${headlineFontSize}px`,
        align: 'center',
      })
    );
    headlineText.setOrigin(0.5, 0);
    state.rightPanel.add(headlineText);

    // Track vertical cursor for dynamic content stacking
    let nextY = headlineY + headlineText.height + panelHeight * 0.025;

    // ── Subtitle — only if user has unfinished lessons (check via lessonPassed in lesson mode) ──
    // In lesson mode, if the module has more lessons the user hasn't completed,
    // show the "unlock more questions" message. We approximate this by checking
    // if there are more questions available (module has multiple lessons).
    // For now, show in lesson mode since the user is progressing through a module.
    if (state.gameMode === 'lesson') {
      const subtitleFontSize = Math.round(panelWidth * 0.028);
      const subtitleText = scene.add.text(
        panelWidth / 2,
        nextY,
        'To unlock more questions, complete the\nnext lesson in the module.',
        createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY, {
          fontSize: `${subtitleFontSize}px`,
          align: 'center',
          lineSpacing: 4,
          wordWrap: { width: contentWidth * 0.85 },
        })
      );
      subtitleText.setOrigin(0.5, 0);
      state.rightPanel.add(subtitleText);
      nextY += subtitleText.height + panelHeight * 0.03;
    }

    // ── Nest Coins pill — only if tree stage increased this session ──
    if (stageIncreased) {
      const coinPillHeight = panelHeight * 0.06;
      const coinPillRadius = coinPillHeight / 2;
      const coinPillFontSize = Math.round(panelWidth * 0.028);
      const coinIconSize = coinPillHeight * 0.8;

      // Create text first to measure actual rendered width
      const coinPillContainer = scene.add.container(0, nextY);
      const coinPillGap = panelWidth * 0.01;
      const coinPillPadding = panelWidth * 0.02;

      const coinLabel = scene.add.text(
        0, 0,
        `You earned ${coinsEarned} Nest Coins!`,
        createTextStyle('BODY_BOLD', COLORS.TEXT_PURE_WHITE, {
          fontSize: `${coinPillFontSize}px`,
        })
      );
      const textWidth = coinLabel.width;

      const coinPillWidth = coinPillPadding + textWidth + coinPillGap + coinIconSize + coinPillPadding;
      const coinPillX = (panelWidth - coinPillWidth) / 2;

      const coinPillBg = scene.add.graphics();
      coinPillBg.fillStyle(COLORS.LINEAR_BLUE_1_START, 1);
      coinPillBg.fillRoundedRect(coinPillX, 0, coinPillWidth, coinPillHeight, coinPillRadius);
      coinPillContainer.add(coinPillBg);

      // Position text and icon centered within pill
      const contentStartX = coinPillX + coinPillPadding;
      coinLabel.setPosition(contentStartX, coinPillHeight / 2);
      coinLabel.setOrigin(0, 0.5);
      coinPillContainer.add(coinLabel);

      if (scene.textures.exists('coinIcon')) {
        const coinIcon = scene.add.image(
          contentStartX + textWidth + coinPillGap,
          coinPillHeight / 2,
          'coinIcon'
        );
        coinIcon.setDisplaySize(coinIconSize, coinIconSize);
        coinIcon.setOrigin(0, 0.5);
        coinPillContainer.add(coinIcon);
      }

      state.rightPanel.add(coinPillContainer);
      nextY += coinPillHeight + panelHeight * 0.025;
    }

    // ── Growth Earned component — outlined rounded rect ──
    const growthBoxFontSize = Math.round(panelWidth * 0.026);
    const growthBoxTitleFontSize = Math.round(panelWidth * 0.028);

    // Build growth lines
    const waterEarned = state.score; // Each correct answer = 1 water (10 GP)
    const fertilizerEarned = state.fertilizerBonusCount;

    const valueLines: string[] = [];
    if (waterEarned > 0) valueLines.push(`Water +${waterEarned}`);
    if (fertilizerEarned > 0) valueLines.push(`Fertilizer +${fertilizerEarned}`);

    if (valueLines.length > 0) {
      const growthBoxWidth = contentWidth * 0.55;
      const growthBoxHeight = panelHeight * 0.10 + (valueLines.length > 1 ? panelHeight * 0.02 : 0);
      const growthBoxRadius = panelHeight * 0.015;
      const growthBoxX = (panelWidth - growthBoxWidth) / 2;

      const growthContainer = scene.add.container(0, nextY);

      const growthBg = scene.add.graphics();
      growthBg.fillStyle(0xD9E0FF, 1);
      growthBg.fillRoundedRect(growthBoxX, 0, growthBoxWidth, growthBoxHeight, growthBoxRadius);
      growthContainer.add(growthBg);

      // Title
      const growthTitle = scene.add.text(
        panelWidth / 2,
        growthBoxHeight * 0.28,
        'Growth Earned',
        createTextStyle('BODY_BOLD', '#1D3CC6', {
          fontSize: `${growthBoxTitleFontSize}px`,
        })
      );
      growthTitle.setOrigin(0.5, 0.5);
      growthContainer.add(growthTitle);

      // Value lines
      const valuesText = scene.add.text(
        panelWidth / 2,
        growthBoxHeight * 0.65,
        valueLines.join('\n'),
        createTextStyle('BODY_BOLD', '#1D3CC6', {
          fontSize: `${growthBoxFontSize}px`,
          align: 'center',
          lineSpacing: 2,
        })
      );
      valuesText.setOrigin(0.5, 0.5);
      growthContainer.add(valuesText);

      state.rightPanel.add(growthContainer);
    }

    // ── MODULE button — positioned in the bottom section below the separator ──
    const bottomSectionMidY = bottomSeparatorY + (panelHeight - bottomSeparatorY) / 2;
    const moduleButtonWidth = panelWidth * 0.24;
    const moduleButtonHeight = panelWidth * 0.08;
    const moduleButtonRadius = moduleButtonHeight / 2;

    state.completionReturnButton = scene.add.container(
      panelWidth - horizontalPadding - moduleButtonWidth / 2,
      bottomSectionMidY
    );

    const moduleButtonBg = scene.add.graphics();
    moduleButtonBg.fillStyle(COLORS.ELEGANT_BLUE);
    moduleButtonBg.fillRoundedRect(
      -moduleButtonWidth / 2,
      -moduleButtonHeight / 2,
      moduleButtonWidth,
      moduleButtonHeight,
      moduleButtonRadius
    );

    const moduleButtonText = scene.add.text(
      0,
      0,
      'MODULE',
      createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${moduleButtonFontSize}px`,
      })
    );
    moduleButtonText.setOrigin(0.5, 0.5);

    state.completionReturnButton.add([moduleButtonBg, moduleButtonText]);

    const hitArea = scene.add.rectangle(
      0, 0, moduleButtonWidth, moduleButtonHeight, 0x000000, 0
    );
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      onReturn();
    });
    state.completionReturnButton.add(hitArea);
    state.completionReturnButton.sendToBack(hitArea);
    state.rightPanel.add(state.completionReturnButton);
  }
}

// ═══════════════════════════════════════════════════════════════
// TREE FULLY GROWN — Special celebratory completion screen
// Shown when the tree reaches max growth during free roam.
// Distinct from showCompletion: golden theme, unique messaging,
// emphasis on the milestone achievement.
// ═══════════════════════════════════════════════════════════════

export function showTreeFullyGrownScreen(
  scene: Phaser.Scene,
  state: GYNSceneState,
  onReturn: () => void
): void {
  const panelWidth = state.rightPanel.getData('panelWidth') as number;
  const panelHeight = state.rightPanel.getData('panelHeight') as number;

  // Keep persistent elements: panelBg (0), "Question Cards" title (1),
  // topSeparator (2), bottomSeparator (3). Destroy everything from index 4+.
  const children = state.rightPanel.getAll();
  children.slice(4).forEach((child) => child.destroy());
  state.feedbackBanner = undefined;
  state.earnedRewardsRow = undefined;

  const HORIZONTAL_PADDING_PERCENT = 0.08;
  const horizontalPadding = panelWidth * HORIZONTAL_PADDING_PERCENT;
  const contentWidth = panelWidth - horizontalPadding * 2;
  const moduleButtonFontSize = Math.round(panelWidth * 0.034);

  const topSeparatorY = state.rightPanel.getData('topSeparatorY') as number;
  const bottomSeparatorY = state.rightPanel.getData('bottomSeparatorY') as number;
  const contentAreaTop = topSeparatorY;
  const contentAreaBottom = bottomSeparatorY;
  const contentAreaHeight = contentAreaBottom - contentAreaTop;

  // Show bird-in-nest on the tree in the left panel
  showBirdNestOnTree(scene, state);

  // ── Bird celebration image (PNG, with bounce-in) ──
  const birdTargetHeight = panelHeight * 0.32;
  const birdY = contentAreaTop + contentAreaHeight * 0.24;
  let birdImage: Phaser.GameObjects.Image | null = null;
  if (scene.textures.exists('bird_celebration')) {
    birdImage = scene.add.image(panelWidth / 2, birdY, 'bird_celebration');
    const nativeHeight = birdImage.height;
    const scaleFactor = birdTargetHeight / nativeHeight;
    birdImage.setScale(0);
    state.rightPanel.add(birdImage);

    // Bounce-in animation
    scene.tweens.add({
      targets: birdImage,
      scaleX: scaleFactor,
      scaleY: scaleFactor,
      duration: 700,
      delay: 200,
      ease: 'Back.easeOut',
    });
  }

  // ── "Your Tree is Fully Grown" headline ──
  const headlineFontSize = Math.round(panelWidth * 0.055);
  const headlineY = birdY + birdTargetHeight / 2 + panelHeight * 0.04;
  const headline = scene.add.text(
    panelWidth / 2,
    headlineY,
    'Your Tree is Fully Grown',
    createTextStyle('H2', COLORS.TEXT_PRIMARY, {
      fontSize: `${headlineFontSize}px`,
      align: 'center',
    })
  );
  headline.setOrigin(0.5, 0);
  headline.setAlpha(0);
  state.rightPanel.add(headline);

  scene.tweens.add({
    targets: headline,
    alpha: 1,
    duration: 500,
    delay: 500,
    ease: 'Power2',
  });

  // ── Subtitle description ──
  const subtitleFontSize = Math.round(panelWidth * 0.028);
  const subtitleY = headlineY + headline.height + panelHeight * 0.03;
  const subtitle = scene.add.text(
    panelWidth / 2,
    subtitleY,
    'The bird has built a nest in your tree.\nYou can keep playing to practice.',
    createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY, {
      fontSize: `${subtitleFontSize}px`,
      align: 'center',
      wordWrap: { width: contentWidth * 0.85 },
      lineSpacing: 4,
    })
  );
  subtitle.setOrigin(0.5, 0);
  subtitle.setAlpha(0);
  state.rightPanel.add(subtitle);

  scene.tweens.add({
    targets: subtitle,
    alpha: 1,
    duration: 500,
    delay: 700,
    ease: 'Power2',
  });

  // Track vertical cursor for dynamic content stacking
  let nextY = subtitleY + subtitle.height + panelHeight * 0.03;

  // ── Nest Coins pill ──
  const totalTreeCoins = state.totalCoinsEarned;
  if (totalTreeCoins > 0) {
    const coinPillHeight = panelHeight * 0.06;
    const coinPillRadius = coinPillHeight / 2;
    const coinPillFontSize = Math.round(panelWidth * 0.028);
    const coinIconSize = coinPillHeight * 0.8;

    const coinPillContainer = scene.add.container(0, nextY);
    const coinPillGap = panelWidth * 0.01;
    const coinPillPadding = panelWidth * 0.02;

    const coinLabel = scene.add.text(
      0, 0,
      `You earned ${totalTreeCoins} Nest Coins!`,
      createTextStyle('BODY_BOLD', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${coinPillFontSize}px`,
      })
    );
    const textW = coinLabel.width;

    const coinPillWidth = coinPillPadding + textW + coinPillGap + coinIconSize + coinPillPadding;
    const coinPillX = (panelWidth - coinPillWidth) / 2;

    const coinPillBg = scene.add.graphics();
    coinPillBg.fillStyle(COLORS.LINEAR_BLUE_1_START, 1);
    coinPillBg.fillRoundedRect(coinPillX, 0, coinPillWidth, coinPillHeight, coinPillRadius);
    coinPillContainer.add(coinPillBg);

    const contentStartX = coinPillX + coinPillPadding;
    coinLabel.setPosition(contentStartX, coinPillHeight / 2);
    coinLabel.setOrigin(0, 0.5);
    coinPillContainer.add(coinLabel);

    if (scene.textures.exists('coinIcon')) {
      const coinIcon = scene.add.image(
        contentStartX + textW + coinPillGap,
        coinPillHeight / 2,
        'coinIcon'
      );
      coinIcon.setDisplaySize(coinIconSize, coinIconSize);
      coinIcon.setOrigin(0, 0.5);
      coinPillContainer.add(coinIcon);
    }

    state.rightPanel.add(coinPillContainer);
    nextY += coinPillHeight + panelHeight * 0.025;
  }

  // ── Growth Earned component ──
  const waterEarned = state.score;
  const fertilizerEarned = state.fertilizerBonusCount;
  const growthBoxFontSize = Math.round(panelWidth * 0.026);
  const growthBoxTitleFontSize = Math.round(panelWidth * 0.028);

  const valueLines: string[] = [];
  if (waterEarned > 0) valueLines.push(`Water +${waterEarned}`);
  if (fertilizerEarned > 0) valueLines.push(`Fertilizer +${fertilizerEarned}`);

  if (valueLines.length > 0) {
    const growthBoxWidth = contentWidth * 0.55;
    const growthBoxHeight = panelHeight * 0.10 + (valueLines.length > 1 ? panelHeight * 0.02 : 0);
    const growthBoxRadius = panelHeight * 0.015;
    const growthBoxX = (panelWidth - growthBoxWidth) / 2;

    const growthContainer = scene.add.container(0, nextY);

    const growthBg = scene.add.graphics();
    growthBg.fillStyle(0xD9E0FF, 1);
    growthBg.fillRoundedRect(growthBoxX, 0, growthBoxWidth, growthBoxHeight, growthBoxRadius);
    growthContainer.add(growthBg);

    const growthTitle = scene.add.text(
      panelWidth / 2,
      growthBoxHeight * 0.28,
      'Growth Earned',
      createTextStyle('BODY_BOLD', '#1D3CC6', {
        fontSize: `${growthBoxTitleFontSize}px`,
      })
    );
    growthTitle.setOrigin(0.5, 0.5);
    growthContainer.add(growthTitle);

    const valuesText = scene.add.text(
      panelWidth / 2,
      growthBoxHeight * 0.65,
      valueLines.join('\n'),
      createTextStyle('BODY_BOLD', '#1D3CC6', {
        fontSize: `${growthBoxFontSize}px`,
        align: 'center',
        lineSpacing: 2,
      })
    );
    valuesText.setOrigin(0.5, 0.5);
    growthContainer.add(valuesText);

    state.rightPanel.add(growthContainer);
  }

  // ── Bottom buttons — positioned in the bottom section below the separator ──
  // Match the same sizing as the NEXT button (panelWidth * 0.24 wide, panelWidth * 0.08 tall)
  const bottomSectionMidY = bottomSeparatorY + (panelHeight - bottomSeparatorY) / 2;
  const moduleButtonWidth = panelWidth * 0.24;
  const moduleButtonHeight = panelWidth * 0.08;
  const moduleButtonRadius = moduleButtonHeight / 2;
  const buttonSpacing = panelWidth * 0.04;

  // -- PLAY AGAIN outlined button (left of MODULE) --
  const playAgainButtonWidth = panelWidth * 0.24;
  const playAgainButtonHeight = panelWidth * 0.08;
  const playAgainButtonRadius = playAgainButtonHeight / 2;

  const playAgainX = panelWidth - horizontalPadding - moduleButtonWidth - buttonSpacing - playAgainButtonWidth / 2;
  const playAgainContainer = scene.add.container(playAgainX, bottomSectionMidY);

  const playAgainBg = scene.add.graphics();
  playAgainBg.lineStyle(2, COLORS.ELEGANT_BLUE);
  playAgainBg.strokeRoundedRect(
    -playAgainButtonWidth / 2, -playAgainButtonHeight / 2,
    playAgainButtonWidth, playAgainButtonHeight, playAgainButtonRadius
  );

  const playAgainText = scene.add.text(0, 0, 'PLAY AGAIN',
    createTextStyle('BUTTON', '#6B85F5', { fontSize: `${moduleButtonFontSize}px` })
  );
  playAgainText.setOrigin(0.5, 0.5);

  playAgainContainer.add([playAgainBg, playAgainText]);

  const playAgainHitArea = scene.add.rectangle(0, 0, playAgainButtonWidth, playAgainButtonHeight, 0x000000, 0);
  playAgainHitArea.setInteractive({ useHandCursor: true });
  playAgainHitArea.on('pointerdown', () => {
    const gyn = scene as any;

    const restartData = {
      mode: (gyn.gameMode || 'freeroam') as 'lesson' | 'freeroam',
      lessonId: gyn.lessonId,
      moduleId: gyn.moduleId,
      questions: state.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options.map((o) => ({ ...o })),
        correctAnswerId: null,
        explanation: q.explanation || '',
      })),
      treeState: state.treeState ? { ...state.treeState } : undefined,
      moduleNumber: gyn.moduleNumber || 1,
      showStartScreen: false,
      awardedQuestionIds: Array.from(gyn.awardedQuestionIds || []),
    };

    const houseScene = scene.scene.get('HouseScene');

    if (houseScene) {
      if (scene.scene.isSleeping('HouseScene')) {
        scene.scene.wake('HouseScene');
      } else if (scene.scene.isPaused('HouseScene')) {
        scene.scene.resume('HouseScene');
      }
    }

    scene.scene.stop('GrowYourNestMinigame');

    setTimeout(() => {
      if (!houseScene || !houseScene.scene) return;

      houseScene.scene.launch('GrowYourNestMinigame', restartData);
      houseScene.scene.pause('HouseScene');

      const newScene = houseScene.scene.get('GrowYourNestMinigame');
      const hs = houseScene as any;
      if (newScene && hs.minigameShutdownHandler) {
        newScene.events.once('minigameCompleted', hs.minigameShutdownHandler);
      }
    }, 50);
  });
  playAgainContainer.add(playAgainHitArea);
  playAgainContainer.sendToBack(playAgainHitArea);
  state.rightPanel.add(playAgainContainer);

  // -- MODULE filled button (right-aligned, matching other screens) --
  state.completionReturnButton = scene.add.container(
    panelWidth - horizontalPadding - moduleButtonWidth / 2,
    bottomSectionMidY
  );

  const moduleButtonBg = scene.add.graphics();
  moduleButtonBg.fillStyle(COLORS.ELEGANT_BLUE);
  moduleButtonBg.fillRoundedRect(
    -moduleButtonWidth / 2, -moduleButtonHeight / 2,
    moduleButtonWidth, moduleButtonHeight, moduleButtonRadius
  );

  const moduleButtonText = scene.add.text(0, 0, 'MODULE',
    createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, { fontSize: `${moduleButtonFontSize}px` })
  );
  moduleButtonText.setOrigin(0.5, 0.5);

  state.completionReturnButton.add([moduleButtonBg, moduleButtonText]);

  const moduleHitArea = scene.add.rectangle(0, 0, moduleButtonWidth, moduleButtonHeight, 0x000000, 0);
  moduleHitArea.setInteractive({ useHandCursor: true });
  moduleHitArea.on('pointerdown', () => {
    onReturn();
  });
  state.completionReturnButton.add(moduleHitArea);
  state.completionReturnButton.sendToBack(moduleHitArea);
  state.rightPanel.add(state.completionReturnButton);
}