import Phaser from 'phaser';
import { scale, scaleFontSize } from '../utils/scaleHelper';
import { COLORS, OPACITY } from '../constants/Colors';
import { FONT_FAMILY, createTextStyle } from '../constants/Typography';

export interface ButtonConfig {
  scene: Phaser.Scene;
  x?: number;
  y?: number;
  width: number;
  height: number;
  text: string;
  backgroundColor?: number;
  hoverColor?: number;
  textColor?: string;
  fontSize?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export class ButtonBuilder {
  /**
   * Create a basic rectangular button with text
   */
  static createButton(config: ButtonConfig): Phaser.GameObjects.Container {
    const {
      scene,
      x = 0,
      y = 0,
      width,
      height,
      text,
      backgroundColor = COLORS.LOGO_BLUE,
      hoverColor = COLORS.ELEGANT_BLUE,
      textColor = COLORS.TEXT_WHITE_HEX,
      fontSize = 16,
      onClick,
      disabled = false,
    } = config;

    const container = scene.add.container(x, y);

    // Create button background
    const buttonBg = scene.add.rectangle(0, 0, width, height, backgroundColor);
    buttonBg.setStrokeStyle(scale(2), COLORS.UNAVAILABLE_BUTTON);
    container.add(buttonBg);

    // Create button text
    const buttonText = scene.add.text(0, 0, text,
      createTextStyle('BUTTON', textColor, { fontSize: `${scaleFontSize(fontSize)}px` })
    ).setOrigin(0.5);
    container.add(buttonText);

    // Make interactive if not disabled
    if (!disabled && onClick) {
      buttonBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          buttonBg.setFillStyle(hoverColor);
          scene.tweens.add({
            targets: container,
            scale: 1.05,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerout', () => {
          buttonBg.setFillStyle(backgroundColor);
          scene.tweens.add({
            targets: container,
            scale: 1,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerdown', onClick);
    }

    if (disabled) {
      container.setAlpha(OPACITY.MEDIUM);
    }

    return container;
  }

  /**
   * Create a rounded button with icon and text
   */
  static createIconButton(
    config: ButtonConfig & {
      icon: string;
      iconSize?: number;
    }
  ): Phaser.GameObjects.Container {
    const {
      scene,
      x = 0,
      y = 0,
      width,
      height,
      text,
      icon,
      iconSize = 20,
      backgroundColor = COLORS.LOGO_BLUE,
      hoverColor = COLORS.ELEGANT_BLUE,
      textColor = COLORS.TEXT_WHITE_HEX,
      fontSize = 14,
      onClick,
      disabled = false,
    } = config;

    const container = scene.add.container(x, y);

    // Create button background (rounded)
    const buttonBg = scene.add.rectangle(0, 0, width, height, backgroundColor, OPACITY.HIGH);
    buttonBg.setStrokeStyle(scale(2), COLORS.PURE_WHITE);
    container.add(buttonBg);

    // Create icon
    const iconText = scene.add.text(-width / 4, 0, icon, {
      fontSize: `${scaleFontSize(iconSize)}px`,
      fontFamily: FONT_FAMILY,
      color: textColor,
    }).setOrigin(0.5);
    container.add(iconText);

    // Create button text
    const buttonText = scene.add.text(width / 8, 0, text,
      createTextStyle('BUTTON', textColor, { fontSize: `${scaleFontSize(fontSize)}px` })
    ).setOrigin(0.5);
    container.add(buttonText);

    // Make interactive if not disabled
    if (!disabled && onClick) {
      buttonBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          buttonBg.setFillStyle(hoverColor, OPACITY.FULL);
          scene.tweens.add({
            targets: container,
            scale: 1.05,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerout', () => {
          buttonBg.setFillStyle(backgroundColor, OPACITY.HIGH);
          scene.tweens.add({
            targets: container,
            scale: 1,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerdown', onClick);
    }

    if (disabled) {
      container.setAlpha(OPACITY.MEDIUM);
    }

    return container;
  }

/**
 * Draw the back-arrow chevron using Phaser Graphics (pure vector).
 *
 * Replicates EXACTLY what the browser does when rendering the SVG as a 24×24
 * <img> tag (Tailwind w-6 h-6) with preserveAspectRatio="xMidYMid meet":
 *
 *   Normal SVG  : viewBox 0 0 13 23, path M11.5 21.5 L1.5 11.5 L11.5 1.5
 *                 stroke #585561, stroke-width 3, linecap/join round
 *   Hover  SVG  : viewBox 0 0 14 24, path M12 22 L2 12 L12 2
 *                 stroke #3658EC, stroke-width 4, linecap/join round
 *
 * "meet" scaling: uniform scale so the entire viewBox fits inside the 24×24
 * box.  Scale = min(24/vbW, 24/vbH).  The scaled viewBox is then centred.
 *
 * All path coordinates are taken verbatim from the SVG, multiplied by the
 * computed scale, then offset so the result is centred on (0,0).
 *
 * Drawing is done in all-positive space (origin = top-left of bounding box
 * including stroke bleed) and graphics.x/y shift it to centre on the
 * container's (0,0). graphics.x/.y are container-relative; setPosition() is
 * NOT used because it operates in scene space.
 */
private static drawBackArrow(
  graphics: Phaser.GameObjects.Graphics,
  isHover: boolean,
  displaySize: number  // target square size in Phaser units = scale(24)
): void {
  graphics.clear();

  // ── SVG source values ─────────────────────────────────────────────────────
  // Normal:  viewBox 13×23, path apex (1.5, 11.5), open ends x=11.5, y=1.5/21.5
  // Hover:   viewBox 14×24, path apex (2, 12),     open ends x=12,   y=2/22
  const vbW       = isHover ? 14   : 13;
  const vbH       = isHover ? 24   : 23;
  const svgSW     = isHover ?  4   :  3;   // stroke-width in SVG units
  const color     = isHover ? 0x3658ec : 0x585561;

  // SVG path points (verbatim from the d= attribute)
  const svgApexX  = isHover ?  2   :  1.5; // leftmost — the arrow tip
  const svgApexY  = isHover ? 12   : 11.5; // vertical centre
  const svgOpenX  = isHover ? 12   : 11.5; // rightmost — open ends
  const svgTopY   = isHover ?  2   :  1.5; // top open end y
  const svgBotY   = isHover ? 22   : 21.5; // bottom open end y

  // ── preserveAspectRatio="xMidYMid meet" ──────────────────────────────────
  // Uniform scale so the full viewBox fits inside displaySize × displaySize
  const s = Math.min(displaySize / vbW, displaySize / vbH);

  // Offset to centre the scaled viewBox in the displaySize square
  const ox = (displaySize - vbW * s) / 2;
  const oy = (displaySize - vbH * s) / 2;

  // Scale path points and apply centering offset
  const strokeWidth = svgSW * s;
  const apexX = svgApexX * s + ox;
  const apexY = svgApexY * s + oy;
  const openX = svgOpenX * s + ox;
  const topY  = svgTopY  * s + oy;
  const botY  = svgBotY  * s + oy;

  // ── Draw in all-positive space ────────────────────────────────────────────
  // Pad by half stroke-width on every edge so round caps are never clipped.
  const pad  = strokeWidth / 2;
  // The total bounding box is displaySize + pad on each side
  const boxSize = displaySize + pad * 2;

  graphics.lineStyle(strokeWidth, color, 1);
  graphics.beginPath();
  // Shift all points by +pad so nothing is at negative coordinates
  graphics.moveTo(openX + pad, topY  + pad);  // top open end  (right side)
  graphics.lineTo(apexX + pad, apexY + pad);  // apex          (left tip ‹)
  graphics.lineTo(openX + pad, botY  + pad);  // bottom open end (right side)
  graphics.strokePath();

  // Centre the bounding box on the container's local (0,0)
  graphics.x = -boxSize / 2;
  graphics.y = -boxSize / 2;
}

/**
 * Create a back button (arrow icon only).
 *
 * Renders the chevron via Phaser.GameObjects.Graphics (vector paths) so it
 * stays crisp at every DPI — no SVG rasterisation, no texture upscaling.
 */
static createBackButton(
  scene: Phaser.Scene,
  onClick: () => void,
  x: number = scale(30),
  y: number = scale(30)
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);

  // Rendered size: match the React LessonView (24 logical px × DPR)
  const arrowSize = scale(24);

  // Graphics object used to draw the vector chevron
  const arrow = scene.add.graphics();
  ButtonBuilder.drawBackArrow(arrow, false, arrowSize);
  container.add(arrow);

  // 44px accessible touch-target zone (invisible, sits on top)
  const hitSize = scale(44);
  const interactiveZone = scene.add.zone(0, 0, hitSize, hitSize);
  interactiveZone.setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      ButtonBuilder.drawBackArrow(arrow, true, arrowSize);
    })
    .on('pointerout', () => {
      ButtonBuilder.drawBackArrow(arrow, false, arrowSize);
    })
    .on('pointerdown', onClick);
  container.add(interactiveZone);

  return container;
}

  /**
   * Create a lesson button with completion states
   */
  static createLessonButton(
    config: ButtonConfig & {
      isCompleted?: boolean;
      isLocked?: boolean;
      coinReward?: number;
    }
  ): Phaser.GameObjects.Container {
    const {
      scene,
      x = 0,
      y = 0,
      width,
      height,
      text,
      isCompleted = false,
      isLocked = false,
      coinReward = 0,
      onClick,
    } = config;

    const container = scene.add.container(x, y);

    // Determine colors based on state
    let backgroundColor: number;
    let textColor: string;
    let statusIcon = '';

    if (isLocked) {
      backgroundColor = COLORS.UNAVAILABLE_BUTTON;
      textColor = COLORS.TEXT_SECONDARY;
      statusIcon = '🔒';
    } else if (isCompleted) {
      backgroundColor = COLORS.STATUS_GREEN;
      textColor = COLORS.TEXT_WHITE_HEX;
      statusIcon = '✓';
    } else {
      backgroundColor = COLORS.LOGO_BLUE;
      textColor = COLORS.TEXT_WHITE_HEX;
    }

    // Create button background
    const buttonBg = scene.add.rectangle(0, 0, width, height, backgroundColor);
    buttonBg.setStrokeStyle(scale(2), COLORS.UNAVAILABLE_BUTTON);
    container.add(buttonBg);

    // Create lesson title
    const lessonText = scene.add.text(0, -scale(8), text,
      createTextStyle('BUTTON', textColor, { fontSize: `${scaleFontSize(16)}px` })
    ).setOrigin(0.5);
    container.add(lessonText);

    // Add status icon if applicable
    if (statusIcon) {
      const icon = scene.add.text(scale(width / 2 - 20), -scale(height / 2 - 15), statusIcon, {
        fontSize: `${scaleFontSize(20)}px`,
        fontFamily: FONT_FAMILY,
        color: textColor,
      }).setOrigin(0.5);
      container.add(icon);
    }

    // Add coin reward if applicable
    if (coinReward > 0 && !isCompleted) {
      const coinText = scene.add.text(0, scale(8), `${coinReward} coins`,
        createTextStyle('CAPTION', textColor)
      ).setOrigin(0.5);
      container.add(coinText);
    }

    // Make interactive if not locked
    if (!isLocked && onClick) {
      // Use opacity for hover instead of new colors
      const originalAlpha = container.alpha;
      
      buttonBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          container.setAlpha(OPACITY.HIGH);
          scene.tweens.add({
            targets: container,
            scale: 1.03,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerout', () => {
          container.setAlpha(originalAlpha);
          scene.tweens.add({
            targets: container,
            scale: 1,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerdown', onClick);
    }

    if (isLocked) {
      container.setAlpha(OPACITY.MEDIUM);
    }

    return container;
  }

  /**
   * Create a minigame button with special styling
   */
  static createMinigameButton(
    config: ButtonConfig & {
      icon?: string;
    }
  ): Phaser.GameObjects.Container {
    const {
      scene,
      x = 0,
      y = 0,
      width,
      height,
      text,
      icon = '🎮',
      onClick,
    } = config;

    const container = scene.add.container(x, y);

    // Use gradient blue colors for minigames
    const buttonBg = scene.add.rectangle(0, 0, width, height, COLORS.LINEAR_BLUE_1_START);
    buttonBg.setStrokeStyle(scale(3), COLORS.ELEGANT_BLUE);
    container.add(buttonBg);

    // Add icon
    const iconText = scene.add.text(0, -scale(15), icon, {
      fontSize: `${scaleFontSize(32)}px`,
      fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);
    container.add(iconText);

    // Add button text
    const buttonText = scene.add.text(0, scale(15), text,
      createTextStyle('BUTTON', COLORS.TEXT_WHITE_HEX, { fontSize: `${scaleFontSize(14)}px` })
    ).setOrigin(0.5);
    container.add(buttonText);

    // Make interactive - use opacity for hover
    if (onClick) {
      buttonBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          container.setAlpha(OPACITY.HIGH);
          scene.tweens.add({
            targets: container,
            scale: 1.05,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerout', () => {
          container.setAlpha(OPACITY.FULL);
          scene.tweens.add({
            targets: container,
            scale: 1,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerdown', onClick);
    }

    return container;
  }
}