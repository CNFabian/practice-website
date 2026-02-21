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

  const description = scene.add.text(
    panelWidth / 2,
    descriptionY,
    descriptionText,
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
      createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${arrowSize}px`,
      })
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
      buttonBg.lineStyle(2, COLORS.LOGO_BLUE);
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
    -buttonWidth * 0.12,
    0,
    'NEXT',
    createTextStyle('BUTTON', COLORS.TEXT_SECONDARY, {
      fontSize: `${fontSize}px`,
    })
  );
  buttonText.setOrigin(0.5, 0.5);

  const arrow = scene.add.text(
    buttonWidth * 0.22,
    0,
    '→',
    createTextStyle('BUTTON', COLORS.TEXT_SECONDARY, {
      fontSize: `${fontSize + 4}px`,
    })
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
    bg.fillRoundedRect(
      -buttonWidth / 2,
      -buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      borderRadius
    );
    text.setColor(COLORS.TEXT_PURE_WHITE);
    arrow.setColor(COLORS.TEXT_PURE_WHITE);
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
    arrow.setColor(COLORS.TEXT_SECONDARY);
  }
}

// ═══════════════════════════════════════════════════════════════
// FEEDBACK BANNER — "CORRECT!" / "INCORRECT" after answer
// ═══════════════════════════════════════════════════════════════

export function showFeedbackBanner(
  scene: Phaser.Scene,
  state: GYNSceneState,
  isCorrect: boolean
): void {
  // Clear any existing banner first
  clearFeedbackBanner(state);

  const panelWidth = state.rightPanel.getData('panelWidth') as number;
  const panelHeight = state.rightPanel.getData('panelHeight') as number;
  const HORIZONTAL_PADDING = panelWidth * 0.08;
  const contentWidth = panelWidth - HORIZONTAL_PADDING * 2;

  // Position the banner below the last option button, above the next button
  const lastOptionBtn = state.optionButtons[state.optionButtons.length - 1];
  const lastOptionY = lastOptionBtn ? lastOptionBtn.y : panelHeight * 0.6;
  const lastOptionHeight = lastOptionBtn
    ? (lastOptionBtn.getData('buttonHeight') as number) || 0
    : 0;

  const bannerGap = panelHeight * 0.025;
  const bannerY = lastOptionY + lastOptionHeight / 2 + bannerGap;
  const bannerHeight = panelHeight * 0.075;
  const bannerRadius = panelHeight * 0.075 / 2;

  state.feedbackBanner = scene.add.container(0, bannerY);

  // Background with gradient-style fill
  const bg = scene.add.graphics();
  if (isCorrect) {
    bg.fillStyle(COLORS.STATUS_GREEN, 1);
  } else {
    bg.fillStyle(COLORS.STATUS_RED, 1);
  }
  bg.fillRoundedRect(
    HORIZONTAL_PADDING,
    -bannerHeight / 2,
    contentWidth,
    bannerHeight,
    bannerRadius
  );
  state.feedbackBanner.add(bg);

  // Text — "CORRECT!" or "INCORRECT"
  const fontSize = Math.round(panelWidth * 0.045);
  const bannerText = isCorrect ? 'CORRECT!' : 'INCORRECT';
  const text = scene.add.text(
    panelWidth / 2,
    0,
    bannerText,
    createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
      fontSize: `${fontSize}px`,
    })
  );
  text.setOrigin(0.5, 0.5);
  state.feedbackBanner.add(text);

  state.rightPanel.add(state.feedbackBanner);

  // ─── Entrance animation ───
  state.feedbackBanner.setScale(0.3, 0.3);
  state.feedbackBanner.setAlpha(0);

  scene.tweens.add({
    targets: state.feedbackBanner,
    scaleX: 1,
    scaleY: 1,
    alpha: 1,
    duration: 350,
    ease: 'Back.easeOut',
    onComplete: () => {
      if (!state.feedbackBanner) return;
      scene.tweens.add({
        targets: state.feedbackBanner,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 150,
        ease: 'Sine.easeInOut',
        yoyo: true,
      });
    },
  });
}

export function clearFeedbackBanner(state: GYNSceneState): void {
  if (state.feedbackBanner) {
    state.feedbackBanner.destroy();
    state.feedbackBanner = undefined;
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

  // Clear feedback banner reference since we just destroyed everything
  state.feedbackBanner = undefined;

  const HORIZONTAL_PADDING_PERCENT = 0.08;
  const horizontalPadding = panelWidth * HORIZONTAL_PADDING_PERCENT;
  const contentWidth = panelWidth - horizontalPadding * 2;

  const titleFontSize = Math.round(panelWidth * 0.068);
  const completionTextFontSize = Math.round(panelWidth * 0.06);
  const boxTitleFontSize = Math.round(panelWidth * 0.03);
  const boxValueFontSize = Math.round(panelWidth * 0.026);
  const coinButtonFontSize = Math.round(panelWidth * 0.03);
  const moduleButtonFontSize = Math.round(panelWidth * 0.034);

  // Determine if this was a failed lesson attempt
  const isLessonFailed = state.gameMode === 'lesson' && state.lessonPassed === false;

  // Title
  const title = scene.add.text(
    panelWidth / 2,
    40,
    'Question Cards',
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

  // Completion / failure headline
  const completionTextY = birdY + panelHeight * 0.14;
  const completionText = scene.add.text(
    panelWidth / 2,
    completionTextY,
    isLessonFailed ? 'Almost There!' : 'Questions Completed!',
    createTextStyle('H2', COLORS.TEXT_PRIMARY, {
      fontSize: `${completionTextFontSize}px`,
    })
  );
  completionText.setOrigin(0.5, 0.5);
  state.rightPanel.add(completionText);

  // Failure hint text — only shown when lesson failed
  if (isLessonFailed) {
    const hintFontSize = Math.round(panelWidth * 0.028);
    const hintText = scene.add.text(
      panelWidth / 2,
      completionTextY + panelHeight * 0.06,
      'You need 3/3 correct to complete.\nTry again — you\'ve got this!',
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY, {
        fontSize: `${hintFontSize}px`,
        align: 'center',
        lineSpacing: 4,
      })
    );
    hintText.setOrigin(0.5, 0.5);
    state.rightPanel.add(hintText);
  }

  // Two stat boxes side by side
  const boxY = completionTextY + panelHeight * (isLessonFailed ? 0.18 : 0.12);
  const boxSpacing = panelWidth * 0.02;
  const boxWidth = (contentWidth - boxSpacing) / 2;
  const boxHeight = panelHeight * 0.12;
  const boxRadius = panelHeight * 0.018;

  // Left box — Growth Earned
  const leftBoxX = horizontalPadding;
  const leftBoxBg = scene.add.graphics();
  leftBoxBg.lineStyle(2, isLessonFailed ? COLORS.TEXT_GREY : COLORS.ELEGANT_BLUE);
  leftBoxBg.strokeRoundedRect(leftBoxX, boxY, boxWidth, boxHeight, boxRadius);
  state.rightPanel.add(leftBoxBg);

  const waterText = scene.add.text(
    leftBoxX + boxWidth / 2,
    boxY + boxHeight * 0.32,
    'Growth Earned',
    createTextStyle('BODY_BOLD', isLessonFailed ? COLORS.TEXT_SECONDARY : COLORS.TEXT_SUCCESS, {
      fontSize: `${boxTitleFontSize}px`,
    })
  );
  waterText.setOrigin(0.5, 0.5);
  state.rightPanel.add(waterText);

  const waterEarned = state.totalGrowthPointsEarned;
  const waterValue = scene.add.text(
    leftBoxX + boxWidth / 2,
    boxY + boxHeight * 0.68,
    `Water +${waterEarned}`,
    createTextStyle('BODY_MEDIUM', isLessonFailed ? COLORS.TEXT_SECONDARY : COLORS.TEXT_SUCCESS, {
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
  rightBoxBg.lineStyle(2, isLessonFailed ? COLORS.TEXT_GREY : COLORS.ELEGANT_BLUE);
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

  const accuracyText = scene.add.text(
    rightBoxX + boxWidth / 2,
    boxY + boxHeight * 0.38,
    accuracyMessage,
    createTextStyle('BODY_BOLD', isLessonFailed ? COLORS.TEXT_WARNING : COLORS.TEXT_SUCCESS, {
      fontSize: `${boxTitleFontSize}px`,
    })
  );
  accuracyText.setOrigin(0.5, 0.5);
  state.rightPanel.add(accuracyText);

  const accuracyValue = scene.add.text(
    rightBoxX + boxWidth / 2,
    boxY + boxHeight * 0.68,
    `${accuracy}% Accuracy`,
    createTextStyle('BODY_BOLD', isLessonFailed ? COLORS.TEXT_WARNING : COLORS.TEXT_SUCCESS, {
      fontSize: `${boxValueFontSize}px`,
    })
  );
  accuracyValue.setOrigin(0.5, 0.5);
  state.rightPanel.add(accuracyValue);

  // Coin / status pill
  const coinButtonY = boxY + boxHeight + panelHeight * 0.045;
  const coinButtonWidth = contentWidth * 0.65;
  const coinButtonHeight = panelHeight * 0.08;
  const coinButtonRadius = coinButtonHeight / 2;

  const coinButton = scene.add.graphics();
  coinButton.fillStyle(isLessonFailed ? COLORS.TEXT_GREY : COLORS.ELEGANT_BLUE);
  coinButton.fillRoundedRect(
    panelWidth / 2 - coinButtonWidth / 2,
    coinButtonY,
    coinButtonWidth,
    coinButtonHeight,
    coinButtonRadius
  );
  state.rightPanel.add(coinButton);

  const coinsEarned = state.totalCoinsEarned;
  let coinDisplayText: string;
  if (isLessonFailed) {
    coinDisplayText = `${state.score}/${state.questions.length} correct\nGet all 3 to earn rewards!`;
  } else if (coinsEarned > 0) {
    coinDisplayText = `You earned ${coinsEarned}\nNest Coins!`;
  } else {
    coinDisplayText = `Keep learning to\nearn more coins!`;
  }
  const coinText = scene.add.text(
    panelWidth / 2,
    coinButtonY + coinButtonHeight / 2,
    coinDisplayText,
    createTextStyle('BODY_BOLD', COLORS.TEXT_PURE_WHITE, {
      fontSize: `${coinButtonFontSize}px`,
      align: 'center',
      lineSpacing: 2,
    })
  );
  coinText.setOrigin(0.5, 0.5);
  state.rightPanel.add(coinText);

  // Bottom button area
  const NEXT_BUTTON_MARGIN_PERCENT = 0.08;
  const nextButtonMargin = panelHeight * NEXT_BUTTON_MARGIN_PERCENT;

  if (isLessonFailed) {
    // ── Two buttons side-by-side: MODULE (left) and TRY AGAIN (right) ──
    const buttonAreaY = panelHeight - nextButtonMargin;
    const gapBetweenButtons = panelWidth * 0.03;
    const buttonHeight = panelWidth * 0.10;
    const buttonRadius = buttonHeight / 2;

    // ── MODULE return button (left) ──
    const moduleReturnButtonWidth = panelWidth * 0.28;
    const moduleReturnButtonX = panelWidth * 0.30;

    const moduleReturnContainer = scene.add.container(moduleReturnButtonX, buttonAreaY);

    const moduleReturnBg = scene.add.graphics();
    moduleReturnBg.fillStyle(COLORS.TEXT_GREY);
    moduleReturnBg.fillRoundedRect(
      -moduleReturnButtonWidth / 2,
      -buttonHeight / 2,
      moduleReturnButtonWidth,
      buttonHeight,
      buttonRadius
    );

    const moduleReturnText = scene.add.text(
      0,
      0,
      'MODULE',
      createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${moduleButtonFontSize}px`,
      })
    );
    moduleReturnText.setOrigin(0.5, 0.5);

    moduleReturnContainer.add([moduleReturnBg, moduleReturnText]);

    const moduleReturnHitArea = scene.add.rectangle(
      0, 0, moduleReturnButtonWidth, buttonHeight, 0x000000, 0
    );
    moduleReturnHitArea.setInteractive({ useHandCursor: true });
    moduleReturnHitArea.on('pointerdown', () => {
      onReturn();
    });
    moduleReturnContainer.add(moduleReturnHitArea);
    moduleReturnContainer.sendToBack(moduleReturnHitArea);
    state.rightPanel.add(moduleReturnContainer);

    // ── TRY AGAIN button (right) ──
    const tryAgainButtonWidth = panelWidth * 0.34;
    const tryAgainButtonX = panelWidth * 0.30 + moduleReturnButtonWidth / 2 + gapBetweenButtons + tryAgainButtonWidth / 2;

    const tryAgainContainer = scene.add.container(tryAgainButtonX, buttonAreaY);

    const tryAgainBg = scene.add.graphics();
    tryAgainBg.fillStyle(COLORS.LOGO_BLUE);
    tryAgainBg.fillRoundedRect(
      -tryAgainButtonWidth / 2,
      -buttonHeight / 2,
      tryAgainButtonWidth,
      buttonHeight,
      buttonRadius
    );

    const tryAgainText = scene.add.text(
      0,
      0,
      'TRY AGAIN',
      createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${moduleButtonFontSize}px`,
      })
    );
    tryAgainText.setOrigin(0.5, 0.5);

    tryAgainContainer.add([tryAgainBg, tryAgainText]);

    const tryAgainHitArea = scene.add.rectangle(
      0, 0, tryAgainButtonWidth, buttonHeight, 0x000000, 0
    );
    tryAgainHitArea.setInteractive({ useHandCursor: true });
    tryAgainHitArea.on('pointerdown', () => {
      // Capture data before stopping the scene — closures referencing
      // scene state will be invalidated once shutdown runs.
      const gyn = scene as any;

      // On a failed lesson attempt the server doesn't persist any growth.
      // However, questions that the user already answered correctly DID
      // earn local growth points.  We must carry two things forward so
      // the retry mirrors the mock-data behaviour:
      //
      //  1. awardedQuestionIds — so already-correct questions don't
      //     double-award base growth points on the next attempt.
      //  2. The locally-accumulated treeState (NOT the server baseline)
      //     so the progress bar / stage display doesn't visually regress.
      //
      // This matches how the mock data worked: mockAwardedQuestionIds
      // persisted across retries, and the mock tree state accumulated.

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
        // Keep the locally-accumulated tree state so progress doesn't reset
        treeState: state.treeState ? { ...state.treeState } : undefined,
        moduleNumber: gyn.moduleNumber || 1,
        showStartScreen: false,
        // Carry forward which questions already awarded growth points
        awardedQuestionIds: Array.from(gyn.awardedQuestionIds || []),
      };

      if (!restartData.lessonId || !restartData.moduleId) return;

      // Stop + re-launch via HouseScene's scene manager.
      // scene.scene.restart() is unreliable for overlay scenes
      // launched via scene.launch(), so we stop first then re-launch.
      const houseScene = scene.scene.get('HouseScene');

      // HouseScene is paused, so its time clock won't fire delayedCalls.
      // Temporarily resume it so the re-launch callback can execute,
      // then re-pause after launching the new GYN scene.
      if (houseScene) {
        scene.scene.resume('HouseScene');
      }

      scene.scene.stop('GrowYourNestMinigame');

      if (houseScene) {
        // Short delay lets Phaser finish the stop lifecycle
        houseScene.time.delayedCall(50, () => {
          houseScene.scene.launch('GrowYourNestMinigame', restartData);

          // Re-pause HouseScene so it stays in the background
          houseScene.scene.pause('HouseScene');

          // Re-attach completion listener so HouseScene slides back on exit
          const newScene = houseScene.scene.get('GrowYourNestMinigame');
          const hs = houseScene as any;
          if (newScene && hs.minigameShutdownHandler) {
            newScene.events.once('minigameCompleted', hs.minigameShutdownHandler);
          }
        });
      }
    });
    tryAgainContainer.add(tryAgainHitArea);
    tryAgainContainer.sendToBack(tryAgainHitArea);
    state.rightPanel.add(tryAgainContainer);
  } else {
    // ── MODULE return button (normal pass / free roam flow) ──
    const moduleButtonX = panelWidth - horizontalPadding - panelWidth * 0.13;
    const moduleButtonY = panelHeight - nextButtonMargin;

    const moduleButtonWidth = panelWidth * 0.24;
    const moduleButtonHeight = panelWidth * 0.08;
    const moduleButtonRadius = moduleButtonHeight / 2;

    state.completionReturnButton = scene.add.container(moduleButtonX, moduleButtonY);

    const moduleButtonBg = scene.add.graphics();
    moduleButtonBg.fillStyle(COLORS.LOGO_BLUE);
    moduleButtonBg.fillRoundedRect(
      -moduleButtonWidth / 2,
      -moduleButtonHeight / 2,
      moduleButtonWidth,
      moduleButtonHeight,
      moduleButtonRadius
    );

    const moduleButtonText = scene.add.text(
      -moduleButtonWidth * 0.12,
      0,
      'MODULE',
      createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${moduleButtonFontSize}px`,
      })
    );
    moduleButtonText.setOrigin(0.5, 0.5);

    const arrowFontSize = Math.round(moduleButtonFontSize * 1.15);
    const arrow = scene.add.text(
      moduleButtonWidth * 0.22,
      0,
      '→',
      createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${arrowFontSize}px`,
      })
    );
    arrow.setOrigin(0.5, 0.5);

    state.completionReturnButton.add([moduleButtonBg, moduleButtonText, arrow]);

    const hitArea = scene.add.rectangle(
      0,
      0,
      moduleButtonWidth,
      moduleButtonHeight,
      0x000000,
      0
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

  // Clear all children except the panel background (index 0)
  const children = state.rightPanel.getAll();
  children.slice(1).forEach((child) => child.destroy());
  state.feedbackBanner = undefined;

  const HORIZONTAL_PADDING_PERCENT = 0.08;
  const horizontalPadding = panelWidth * HORIZONTAL_PADDING_PERCENT;
  const contentWidth = panelWidth - horizontalPadding * 2;

  // ── Golden gradient overlay on the panel ──
  const goldOverlay = scene.add.graphics();
  const cornerRadius = 16;
  goldOverlay.fillStyle(COLORS.LOGO_YELLOW, 0.08);
  goldOverlay.fillRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
  state.rightPanel.add(goldOverlay);

  // ── Sparkle particles (simple star emojis with tweens) ──
  const sparklePositions = [
    { x: panelWidth * 0.15, y: panelHeight * 0.12 },
    { x: panelWidth * 0.85, y: panelHeight * 0.15 },
    { x: panelWidth * 0.1, y: panelHeight * 0.42 },
    { x: panelWidth * 0.9, y: panelHeight * 0.38 },
    { x: panelWidth * 0.2, y: panelHeight * 0.65 },
    { x: panelWidth * 0.82, y: panelHeight * 0.62 },
  ];
  const sparkleChars = ['✦', '✧', '⭐', '✦', '✧', '⭐'];
  const sparkleFontSizes = [16, 14, 18, 15, 13, 17];

  sparklePositions.forEach((pos, i) => {
    const sparkle = scene.add.text(
      pos.x,
      pos.y,
      sparkleChars[i % sparkleChars.length],
      {
        fontSize: `${sparkleFontSizes[i % sparkleFontSizes.length]}px`,
      }
    );
    sparkle.setOrigin(0.5, 0.5);
    sparkle.setAlpha(0);
    state.rightPanel.add(sparkle);

    // Fade in with staggered delay, then pulse
    scene.tweens.add({
      targets: sparkle,
      alpha: { from: 0, to: 0.7 },
      scale: { from: 0.3, to: 1 },
      duration: 600,
      delay: 300 + i * 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: sparkle,
          alpha: { from: 0.7, to: 0.3 },
          scale: { from: 1, to: 0.7 },
          duration: 1200 + i * 200,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        });
      },
    });
  });

  // ── Title ──
  const titleFontSize = Math.round(panelWidth * 0.068);
  const title = scene.add.text(
    panelWidth / 2,
    40,
    'Question Cards',
    createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: `${titleFontSize}px` })
  );
  title.setOrigin(0.5, 0);
  state.rightPanel.add(title);

  // ── Bird celebration image (scaled up, with bounce-in) ──
  const birdSize = panelWidth * 0.35;
  const birdY = panelHeight * 0.28;
  let birdImage: Phaser.GameObjects.Image | null = null;
  if (scene.textures.exists('bird_celebration')) {
    birdImage = scene.add.image(panelWidth / 2, birdY, 'bird_celebration');
    birdImage.setDisplaySize(birdSize, birdSize);
    birdImage.setScale(0);
    state.rightPanel.add(birdImage);

    // Bounce-in animation
    scene.tweens.add({
      targets: birdImage,
      scaleX: birdSize / birdImage.width,
      scaleY: birdSize / birdImage.height,
      duration: 700,
      delay: 200,
      ease: 'Back.easeOut',
    });
  }

  // ── "Tree Fully Grown!" headline ──
  const headlineFontSize = Math.round(panelWidth * 0.065);
  const headlineY = birdY + birdSize * 0.55 + panelHeight * 0.04;
  const headline = scene.add.text(
    panelWidth / 2,
    headlineY,
    'Tree Fully Grown!',
    createTextStyle('H2', COLORS.TEXT_PRIMARY, {
      fontSize: `${headlineFontSize}px`,
    })
  );
  headline.setOrigin(0.5, 0.5);
  headline.setAlpha(0);
  state.rightPanel.add(headline);

  scene.tweens.add({
    targets: headline,
    alpha: 1,
    y: headlineY,
    duration: 500,
    delay: 500,
    ease: 'Power2',
  });

  // ── Subtitle description ──
  const subtitleFontSize = Math.round(panelWidth * 0.03);
  const subtitleY = headlineY + panelHeight * 0.06;
  const subtitle = scene.add.text(
    panelWidth / 2,
    subtitleY,
    'Congratulations! Your tree has reached full growth\nand the bird has built her nest.',
    createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY, {
      fontSize: `${subtitleFontSize}px`,
      align: 'center',
      wordWrap: { width: contentWidth * 0.9 },
      lineSpacing: subtitleFontSize * 0.5,
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

  // ── Stats row: Growth Total | Total Coins ──
  const boxY = subtitleY + subtitle.height + panelHeight * 0.06;
  const boxSpacing = panelWidth * 0.02;
  const boxWidth = (contentWidth - boxSpacing) / 2;
  const boxHeight = panelHeight * 0.12;
  const boxRadius = panelHeight * 0.018;
  const boxTitleFontSize = Math.round(panelWidth * 0.028);
  const boxValueFontSize = Math.round(panelWidth * 0.024);

  // Left box — Total Growth
  const leftBoxX = horizontalPadding;
  const leftBoxBg = scene.add.graphics();
  leftBoxBg.lineStyle(2, COLORS.STATUS_GREEN);
  leftBoxBg.fillStyle(COLORS.STATUS_GREEN, 0.08);
  leftBoxBg.fillRoundedRect(leftBoxX, boxY, boxWidth, boxHeight, boxRadius);
  leftBoxBg.strokeRoundedRect(leftBoxX, boxY, boxWidth, boxHeight, boxRadius);
  state.rightPanel.add(leftBoxBg);

  const totalStages = state.treeState?.total_stages ?? 5;
  const totalPoints = totalStages * (state.treeState?.points_per_stage ?? 50);
  const growthTitle = scene.add.text(
    leftBoxX + boxWidth / 2,
    boxY + boxHeight * 0.32,
    'Tree Complete',
    createTextStyle('BODY_BOLD', COLORS.TEXT_SUCCESS, {
      fontSize: `${boxTitleFontSize}px`,
    })
  );
  growthTitle.setOrigin(0.5, 0.5);
  state.rightPanel.add(growthTitle);

  const growthValue = scene.add.text(
    leftBoxX + boxWidth / 2,
    boxY + boxHeight * 0.68,
    `${totalPoints}/${totalPoints} pts`,
    createTextStyle('BODY_MEDIUM', COLORS.TEXT_SUCCESS, {
      fontSize: `${boxValueFontSize}px`,
    })
  );
  growthValue.setOrigin(0.5, 0.5);
  state.rightPanel.add(growthValue);

  // Right box — Session Stats
  const rightBoxX = leftBoxX + boxWidth + boxSpacing;
  const rightBoxBg = scene.add.graphics();
  rightBoxBg.lineStyle(2, COLORS.ELEGANT_BLUE);
  rightBoxBg.fillStyle(COLORS.ELEGANT_BLUE, 0.08);
  rightBoxBg.fillRoundedRect(rightBoxX, boxY, boxWidth, boxHeight, boxRadius);
  rightBoxBg.strokeRoundedRect(rightBoxX, boxY, boxWidth, boxHeight, boxRadius);
  state.rightPanel.add(rightBoxBg);

  const sessionTitle = scene.add.text(
    rightBoxX + boxWidth / 2,
    boxY + boxHeight * 0.32,
    'This Session',
    createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, {
      fontSize: `${boxTitleFontSize}px`,
    })
  );
  sessionTitle.setOrigin(0.5, 0.5);
  state.rightPanel.add(sessionTitle);

  const sessionCoins = state.totalCoinsEarned;
  const sessionDisplayText = sessionCoins > 0
    ? `+${state.totalGrowthPointsEarned} growth  |  +${sessionCoins} coins`
    : `+${state.totalGrowthPointsEarned} growth  |  Practice mode`;
  const sessionValue = scene.add.text(
    rightBoxX + boxWidth / 2,
    boxY + boxHeight * 0.68,
    sessionDisplayText,
    createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY, {
      fontSize: `${boxValueFontSize}px`,
    })
  );
  sessionValue.setOrigin(0.5, 0.5);
  state.rightPanel.add(sessionValue);

  // ── "You can still play Free Roam" note ──
  const noteFontSize = Math.round(panelWidth * 0.024);
  const noteY = boxY + boxHeight + panelHeight * 0.04;
  const note = scene.add.text(
    panelWidth / 2,
    noteY,
    'You can still revisit Free Roam to practice questions!\nReplaying is for learning — no additional coins are earned.',
    createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY, {
      fontSize: `${noteFontSize}px`,
      align: 'center',
      fontStyle: 'italic',
    })
  );
  note.setOrigin(0.5, 0.5);
  state.rightPanel.add(note);

  // ── MODULE return button ──
  const moduleButtonFontSize = Math.round(panelWidth * 0.034);
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
  moduleButtonBg.fillRoundedRect(
    -moduleButtonWidth / 2,
    -moduleButtonHeight / 2,
    moduleButtonWidth,
    moduleButtonHeight,
    moduleButtonRadius
  );

  const moduleButtonText = scene.add.text(
    -moduleButtonWidth * 0.12,
    0,
    'MODULE',
    createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
      fontSize: `${moduleButtonFontSize}px`,
    })
  );
  moduleButtonText.setOrigin(0.5, 0.5);

  const arrowFontSize = Math.round(moduleButtonFontSize * 1.15);
  const arrow = scene.add.text(
    moduleButtonWidth * 0.22,
    0,
    '→',
    createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
      fontSize: `${arrowFontSize}px`,
    })
  );
  arrow.setOrigin(0.5, 0.5);

  state.completionReturnButton.add([moduleButtonBg, moduleButtonText, arrow]);

  const hitArea = scene.add.rectangle(
    0,
    0,
    moduleButtonWidth,
    moduleButtonHeight,
    0x000000,
    0
  );
  hitArea.setInteractive({ useHandCursor: true });
  hitArea.on('pointerdown', () => {
    onReturn();
  });
  state.completionReturnButton.add(hitArea);
  state.completionReturnButton.sendToBack(hitArea);
  state.rightPanel.add(state.completionReturnButton);
}