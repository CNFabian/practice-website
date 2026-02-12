import Phaser from 'phaser';
import { createTextStyle } from '../../../constants/Typography';
import { COLORS } from '../../../constants/Colors';
import type { GYNSceneState } from './GYNTypes';

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

  const title = scene.add.text(
    panelWidth / 2,
    40,
    'Question Cards',
    createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: '36px' })
  );
  title.setOrigin(0.5, 0);
  state.rightPanel.add(title);
  state.rightPanel.setData('panelWidth', panelWidth);
  state.rightPanel.setData('panelHeight', panelHeight);

  if (state.showingStartScreen) {
    showStartScreen(scene, state, callbacks);
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
  }
): void {
  const panelWidth = state.rightPanel.getData('panelWidth') as number;
  const panelHeight = state.rightPanel.getData('panelHeight') as number;

  const HORIZONTAL_PADDING = panelWidth * 0.08;
  const contentWidth = panelWidth - HORIZONTAL_PADDING * 2;

  // Bird illustration
  const birdSize = Math.min(220, panelWidth * 0.45);
  const birdY = panelHeight * 0.35;

  let birdGraphic: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;

  if (scene.textures.exists('bird_celebration')) {
    birdGraphic = scene.add.image(panelWidth / 2, birdY, 'bird_celebration');
    (birdGraphic as Phaser.GameObjects.Image).setDisplaySize(birdSize, birdSize);
  } else {
    birdGraphic = scene.add.graphics();
    (birdGraphic as Phaser.GameObjects.Graphics).fillStyle(COLORS.ELEGANT_BLUE, 0.3);
    (birdGraphic as Phaser.GameObjects.Graphics).fillCircle(panelWidth / 2, birdY, birdSize / 2);
  }
  state.rightPanel.add(birdGraphic);

  if (!scene.textures.exists('bird_celebration')) {
    const birdEmoji = scene.add.text(panelWidth / 2, birdY, '🐦', {
      fontSize: `${birdSize * 0.6}px`,
    });
    birdEmoji.setOrigin(0.5, 0.5);
    state.rightPanel.add(birdEmoji);
  }

  // Description
  const descriptionY = birdY + birdSize / 2 + panelHeight * 0.08;
  const descriptionFontSize = Math.round(panelWidth * 0.038);

  let descriptionText = `Answer questions to earn water and fertilizer to grow your tree of Module ${state.moduleNumber}!`;
  if (state.gameMode === 'lesson') {
    descriptionText = `Answer 3 questions about this lesson to help your tree grow! Get 3 correct in a row for a fertilizer bonus.`;
  } else if (state.gameMode === 'freeroam') {
    descriptionText = `Free Roam mode! Answer questions from all lessons to keep growing your tree. Progress is saved after each question.`;
  }

  const description = scene.add.text(panelWidth / 2, descriptionY, descriptionText,
    createTextStyle('BODY_MEDIUM', COLORS.TEXT_PRIMARY, {
      fontSize: `${descriptionFontSize}px`,
      align: 'center',
      wordWrap: { width: contentWidth },
      lineSpacing: descriptionFontSize * 0.4,
    })
  );
  description.setOrigin(0.5, 0.5);
  state.rightPanel.add(description);

  // Two buttons side by side
  const buttonsY = panelHeight - panelHeight * 0.12;
  const buttonGap = panelWidth * 0.03;
  const buttonWidth = (contentWidth - buttonGap) / 2;
  const buttonHeight = panelHeight * 0.08;
  const buttonRadius = buttonHeight * 0.3;

  // "DO IT LATER" button
  const laterButtonX = HORIZONTAL_PADDING;
  const laterButton = createStartScreenButton(
    scene,
    laterButtonX,
    buttonsY,
    buttonWidth,
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
  const goButtonX = laterButtonX + buttonWidth + buttonGap;
  const goButton = createStartScreenButton(
    scene,
    goButtonX,
    buttonsY,
    buttonWidth,
    buttonHeight,
    buttonRadius,
    "LET'S GO",
    true,
    () => {
      clearStartScreen(state);
      state.showingStartScreen = false;
      updateQuestion(scene, state, callbacks);
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
    bg.fillStyle(COLORS.LOGO_BLUE, 1);
  } else {
    bg.fillStyle(COLORS.PURE_WHITE, 0);
  }
  bg.fillRoundedRect(0, -height / 2, width, height, radius);
  container.add(bg);

  const fontSize = Math.round(width * 0.065);
  const textColor = isPrimary ? COLORS.TEXT_PURE_WHITE : COLORS.TEXT_SECONDARY;
  const buttonText = scene.add.text(
    width / 2,
    0,
    text,
    createTextStyle('BUTTON', textColor, { fontSize: `${fontSize}px` })
  );
  buttonText.setOrigin(0.5, 0.5);
  container.add(buttonText);

  if (isPrimary) {
    const arrowSize = Math.round(fontSize * 1.2);
    const arrow = scene.add.text(
      width * 0.85,
      0,
      '→',
      createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, { fontSize: `${arrowSize}px` })
    );
    arrow.setOrigin(0.5, 0.5);
    container.add(arrow);
    container.setData('arrow', arrow);
  }

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
      bg.fillStyle(COLORS.LOGO_BLUE, 0.9);
    } else {
      bg.fillStyle(COLORS.LIGHT_BACKGROUND_BLUE, 1);
    }
    bg.fillRoundedRect(0, -height / 2, width, height, radius);
  });

  hitArea.on('pointerout', () => {
    bg.clear();
    if (isPrimary) {
      bg.fillStyle(COLORS.LOGO_BLUE, 1);
    } else {
      bg.fillStyle(COLORS.PURE_WHITE, 0);
    }
    bg.fillRoundedRect(0, -height / 2, width, height, radius);
  });

  hitArea.on('pointerdown', onClick);

  container.add(hitArea);
  container.sendToBack(hitArea);

  return container;
}

export function clearStartScreen(state: GYNSceneState): void {
  const children = state.rightPanel.getAll();
  for (let i = children.length - 1; i >= 2; i--) {
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
    // Signal main scene to handle completion
    callbacks.onNext();
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

  const HORIZONTAL_PADDING_PERCENT = 0.08;
  const horizontalPadding = panelWidth * HORIZONTAL_PADDING_PERCENT;
  const contentWidth = panelWidth - horizontalPadding * 2;
  const QUESTION_START_PERCENT = 0.18;
  const QUESTION_TO_OPTIONS_GAP_PERCENT = 0.15;
  const OPTION_BUTTON_HEIGHT_PERCENT = 0.095;
  const OPTION_GAP_PERCENT = 0.02;
  const NEXT_BUTTON_MARGIN_PERCENT = 0.08;
  const QUESTION_TEXT_FONT_PERCENT = 0.04;
  const OPTION_LETTER_FONT_PERCENT = 0.035;
  const OPTION_TEXT_FONT_PERCENT = 0.03;

  const questionStartY = panelHeight * QUESTION_START_PERCENT;
  const questionToOptionsGap = panelHeight * QUESTION_TO_OPTIONS_GAP_PERCENT;
  const optionButtonHeight = panelHeight * OPTION_BUTTON_HEIGHT_PERCENT;
  const optionGap = panelHeight * OPTION_GAP_PERCENT;
  const nextButtonMargin = panelHeight * NEXT_BUTTON_MARGIN_PERCENT;
  const questionTextFontSize = Math.round(panelWidth * QUESTION_TEXT_FONT_PERCENT);
  const optionLetterFontSize = Math.round(panelWidth * OPTION_LETTER_FONT_PERCENT);
  const optionTextFontSize = Math.round(panelWidth * OPTION_TEXT_FONT_PERCENT);

  const fullQuestionText = `${state.currentQuestionIndex + 1}. ${question.question}`;

  state.questionText = scene.add.text(horizontalPadding, questionStartY, fullQuestionText,
    createTextStyle('BODY_MEDIUM', COLORS.TEXT_PRIMARY, {
      fontSize: `${questionTextFontSize}px`,
      wordWrap: { width: contentWidth },
      lineSpacing: questionTextFontSize * 0.4,
    })
  );
  state.questionText.setOrigin(0, 0);
  state.rightPanel.add(state.questionText);
  state.questionNumber = state.questionText;

  const optionsStartY = questionStartY + state.questionText.height + questionToOptionsGap;

  question.options.forEach((option, index) => {
    const optionY = optionsStartY + index * (optionButtonHeight + optionGap);
    const optionContainer = createOptionButton(
      scene,
      state,
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
  state: GYNSceneState,
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
  buttonBg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
  buttonBg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
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
    createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, { fontSize: `${letterFontSize}px` })
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

  buttonHitArea.setInteractive({ useHandCursor: true });
  buttonHitArea.on('pointerdown', () => onSelect(option.letter));

  buttonHitArea.on('pointerover', () => {
    if (state.selectedAnswer !== option.letter) {
      buttonBg.clear();
      buttonBg.fillStyle(COLORS.ELEGANT_BLUE, 0.3);
      buttonBg.lineStyle(2, COLORS.ELEGANT_BLUE);
      buttonBg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      buttonBg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
    }
  });

  buttonHitArea.on('pointerout', () => {
    if (state.selectedAnswer === option.letter) {
      buttonBg.clear();
      buttonBg.fillStyle(COLORS.ELEGANT_BLUE, 0.2);
      buttonBg.lineStyle(2, COLORS.LOGO_BLUE);
      buttonBg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      buttonBg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
    } else if (state.selectedAnswer !== null) {
      buttonBg.clear();
      buttonBg.fillStyle(COLORS.TEXT_WHITE, 1);
      buttonBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
      buttonBg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      buttonBg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
    } else {
      buttonBg.clear();
      buttonBg.fillStyle(COLORS.ELEGANT_BLUE, 0.2);
      buttonBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
      buttonBg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      buttonBg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
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
  buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, borderRadius);

  const buttonText = scene.add.text(-buttonWidth * 0.12, 0, 'NEXT',
    createTextStyle('BUTTON', COLORS.TEXT_SECONDARY, { fontSize: `${fontSize}px` })
  );
  buttonText.setOrigin(0.5, 0.5);

  const arrow = scene.add.text(buttonWidth * 0.22, 0, '→',
    createTextStyle('BUTTON', COLORS.TEXT_SECONDARY, { fontSize: `${fontSize + 4}px` })
  );
  arrow.setOrigin(0.5, 0.5);

  state.nextButton.add([buttonBg, buttonText, arrow]);
  state.nextButton.setData('bg', buttonBg);
  state.nextButton.setData('text', buttonText);
  state.nextButton.setData('arrow', arrow);
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
  const arrow = state.nextButton.getData('arrow') as Phaser.GameObjects.Text;
  const buttonWidth = state.nextButton.getData('buttonWidth') as number;
  const buttonHeight = state.nextButton.getData('buttonHeight') as number;
  const borderRadius = state.nextButton.getData('borderRadius') as number;

  state.nextButton.setData('enabled', enabled);

  bg.clear();
  if (enabled) {
    bg.fillStyle(COLORS.LOGO_BLUE);
    bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, borderRadius);
    text.setColor(COLORS.TEXT_PURE_WHITE);
    arrow.setColor(COLORS.TEXT_PURE_WHITE);
  } else {
    bg.fillStyle(COLORS.UNAVAILABLE_BUTTON);
    bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, borderRadius);
    text.setColor(COLORS.TEXT_SECONDARY);
    arrow.setColor(COLORS.TEXT_SECONDARY);
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

  const children = state.rightPanel.getAll();
  children.slice(1).forEach((child) => child.destroy());

  const HORIZONTAL_PADDING_PERCENT = 0.08;
  const horizontalPadding = panelWidth * HORIZONTAL_PADDING_PERCENT;
  const contentWidth = panelWidth - horizontalPadding * 2;

  const titleFontSize = Math.round(panelWidth * 0.068);
  const completionTextFontSize = Math.round(panelWidth * 0.06);
  const boxTitleFontSize = Math.round(panelWidth * 0.03);
  const boxValueFontSize = Math.round(panelWidth * 0.026);
  const coinButtonFontSize = Math.round(panelWidth * 0.03);
  const moduleButtonFontSize = Math.round(panelWidth * 0.034);

  // Title
  const title = scene.add.text(panelWidth / 2, 40, 'Question Cards',
    createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: `${titleFontSize}px` })
  );
  title.setOrigin(0.5, 0);
  state.rightPanel.add(title);

  // Bird
  const birdSize = panelWidth * 0.3;
  const birdY = panelHeight * 0.32;
  if (scene.textures.exists('bird_celebration')) {
    const bird = scene.add.image(panelWidth / 2, birdY, 'bird_celebration');
    bird.setDisplaySize(birdSize, birdSize);
    state.rightPanel.add(bird);
  }

  // "Questions Completed!" text
  const completionTextY = birdY + panelHeight * 0.14;
  const completionText = scene.add.text(panelWidth / 2, completionTextY, 'Questions Completed!',
    createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: `${completionTextFontSize}px` })
  );
  completionText.setOrigin(0.5, 0.5);
  state.rightPanel.add(completionText);

  // Two stat boxes side by side
  const boxY = completionTextY + panelHeight * 0.12;
  const boxSpacing = panelWidth * 0.02;
  const boxWidth = (contentWidth - boxSpacing) / 2;
  const boxHeight = panelHeight * 0.12;
  const boxRadius = panelHeight * 0.018;

  // Left box — Growth Earned
  const leftBoxX = horizontalPadding;
  const leftBoxBg = scene.add.graphics();
  leftBoxBg.lineStyle(2, COLORS.ELEGANT_BLUE);
  leftBoxBg.strokeRoundedRect(leftBoxX, boxY, boxWidth, boxHeight, boxRadius);
  state.rightPanel.add(leftBoxBg);

  const waterText = scene.add.text(leftBoxX + boxWidth / 2, boxY + boxHeight * 0.32, 'Growth Earned',
    createTextStyle('BODY_BOLD', COLORS.TEXT_SUCCESS, { fontSize: `${boxTitleFontSize}px` })
  );
  waterText.setOrigin(0.5, 0.5);
  state.rightPanel.add(waterText);

  const waterEarned = state.gameMode !== 'legacy' ? state.totalGrowthPointsEarned : state.score;
  const waterValue = scene.add.text(leftBoxX + boxWidth / 2, boxY + boxHeight * 0.68, `Water +${waterEarned}`,
    createTextStyle('BODY_MEDIUM', COLORS.TEXT_SUCCESS, {
      fontSize: `${boxValueFontSize}px`,
      align: 'center',
      lineSpacing: 2,
    })
  );
  waterValue.setOrigin(0.5, 0.5);
  state.rightPanel.add(waterValue);

  // Right box — Accuracy
  const rightBoxX = leftBoxX + boxWidth + boxSpacing;
  const rightBoxBg = scene.add.graphics();
  rightBoxBg.lineStyle(2, COLORS.ELEGANT_BLUE);
  rightBoxBg.strokeRoundedRect(rightBoxX, boxY, boxWidth, boxHeight, boxRadius);
  state.rightPanel.add(rightBoxBg);

  const accuracy = Math.round((state.score / state.questions.length) * 100);
  let accuracyMessage: string;
  if (accuracy === 100) {
    accuracyMessage = 'Perfect!';
  } else if (accuracy >= 80) {
    accuracyMessage = 'Amazing!';
  } else if (accuracy >= 60) {
    accuracyMessage = 'Great Job!';
  } else if (accuracy >= 40) {
    accuracyMessage = 'Good Effort!';
  } else if (accuracy > 0) {
    accuracyMessage = 'Keep Trying!';
  } else {
    accuracyMessage = 'Try Again!';
  }

  const accuracyText = scene.add.text(rightBoxX + boxWidth / 2, boxY + boxHeight * 0.38, accuracyMessage,
    createTextStyle('BODY_BOLD', COLORS.TEXT_SUCCESS, { fontSize: `${boxTitleFontSize}px` })
  );
  accuracyText.setOrigin(0.5, 0.5);
  state.rightPanel.add(accuracyText);

  const accuracyValue = scene.add.text(rightBoxX + boxWidth / 2, boxY + boxHeight * 0.68, `${accuracy}% Accuracy`,
    createTextStyle('BODY_BOLD', COLORS.TEXT_SUCCESS, { fontSize: `${boxValueFontSize}px` })
  );
  accuracyValue.setOrigin(0.5, 0.5);
  state.rightPanel.add(accuracyValue);

  // Coin earned button
  const coinButtonY = boxY + boxHeight + panelHeight * 0.045;
  const coinButtonWidth = contentWidth * 0.65;
  const coinButtonHeight = panelHeight * 0.08;
  const coinButtonRadius = coinButtonHeight / 2;
  const coinButton = scene.add.graphics();
  coinButton.fillStyle(COLORS.ELEGANT_BLUE);
  coinButton.fillRoundedRect(panelWidth / 2 - coinButtonWidth / 2, coinButtonY, coinButtonWidth, coinButtonHeight, coinButtonRadius);
  state.rightPanel.add(coinButton);

  const coinsEarned = state.gameMode !== 'legacy' ? state.totalCoinsEarned : state.score * 5;
  const coinText = scene.add.text(panelWidth / 2, coinButtonY + coinButtonHeight / 2, `You earned ${coinsEarned}\nNest Coins!`,
    createTextStyle('BODY_BOLD', COLORS.TEXT_PURE_WHITE, {
      fontSize: `${coinButtonFontSize}px`,
      align: 'center',
      lineSpacing: 2,
    })
  );
  coinText.setOrigin(0.5, 0.5);
  state.rightPanel.add(coinText);

  // MODULE return button
  const NEXT_BUTTON_MARGIN_PERCENT = 0.08;
  const nextButtonMargin = panelHeight * NEXT_BUTTON_MARGIN_PERCENT;
  const moduleButtonX = panelWidth - horizontalPadding - panelWidth * 0.13;
  const moduleButtonY = panelHeight - nextButtonMargin;
  const moduleButtonWidth = panelWidth * 0.24;
  const moduleButtonHeight = panelWidth * 0.08;
  const moduleButtonRadius = moduleButtonHeight / 2;

  state.completionReturnButton = scene.add.container(moduleButtonX, moduleButtonY);

  const moduleButtonBg = scene.add.graphics();
  moduleButtonBg.fillStyle(COLORS.LOGO_BLUE);
  moduleButtonBg.fillRoundedRect(-moduleButtonWidth / 2, -moduleButtonHeight / 2, moduleButtonWidth, moduleButtonHeight, moduleButtonRadius);

  const moduleButtonText = scene.add.text(-moduleButtonWidth * 0.12, 0, 'MODULE',
    createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, { fontSize: `${moduleButtonFontSize}px` })
  );
  moduleButtonText.setOrigin(0.5, 0.5);

  const arrowFontSize = Math.round(moduleButtonFontSize * 1.15);
  const arrow = scene.add.text(moduleButtonWidth * 0.22, 0, '→',
    createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, { fontSize: `${arrowFontSize}px` })
  );
  arrow.setOrigin(0.5, 0.5);

  state.completionReturnButton.add([moduleButtonBg, moduleButtonText, arrow]);

  const hitArea = scene.add.rectangle(0, 0, moduleButtonWidth, moduleButtonHeight, 0x000000, 0);
  hitArea.setInteractive({ useHandCursor: true });
  hitArea.on('pointerdown', () => {
    onReturn();
  });
  state.completionReturnButton.add(hitArea);
  state.completionReturnButton.sendToBack(hitArea);

  state.rightPanel.add(state.completionReturnButton);
}