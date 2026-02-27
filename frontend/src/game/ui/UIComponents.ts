import Phaser from 'phaser';
import { scale, scaleFontSize } from '../utils/scaleHelper';
import { COLORS } from '../constants/Colors';
import { FONT_FAMILY, createTextStyle } from '../constants/Typography';
import { ASSET_KEYS } from '../constants/AssetKeys';

export class UIComponents {

  /**
   * Create a coin counter display
   */
  static createCoinCounter(
    scene: Phaser.Scene,
    coins: number
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);
    container.setDepth(100); // High depth to stay on top

    // Background - rounded rectangle with white fill and neumorphic shadow layers
    const bgWidth = scale(120);
    const bgHeight = scale(40);
    const radius = scale(12);

    // Subtle tight shadow — single layer, close offset, low opacity
    const shadow = scene.add.graphics();
    shadow.fillStyle(0xa7b4d4, 0.25);
    shadow.fillRoundedRect(-bgWidth/2 + scale(2), -bgHeight/2 + scale(2), bgWidth, bgHeight, radius);
    container.add(shadow);

    // Main white background
    const background = scene.add.graphics();
    background.fillStyle(COLORS.PURE_WHITE, 1);
    background.fillRoundedRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, radius);
    // Thin border for definition
    background.lineStyle(scale(1), 0xa7b4d4, 0.15);
    background.strokeRoundedRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, radius);
    container.add(background);

    // Coin icon (on the left) - using image instead of emoji
    // OPT-02: Check texture exists (may not be loaded yet if walkthrough triggered early)
    if (scene.textures.exists('coinIcon')) {
      const coinIcon = scene.add.image(-scale(30), 0, 'coinIcon');
      coinIcon.setDisplaySize(scale(30), scale(30));
      coinIcon.setOrigin(0.5);
      container.add(coinIcon);
    } else {
      // Texture not ready yet — add it as soon as it becomes available
      const onTextureAdd = (key: string) => {
        if (key === 'coinIcon') {
          scene.textures.off('addtexture', onTextureAdd);
          // Verify container still exists (scene may have been destroyed)
          if (container && container.scene) {
            const coinIcon = scene.add.image(-scale(30), 0, 'coinIcon');
            coinIcon.setDisplaySize(scale(30), scale(30));
            coinIcon.setOrigin(0.5);
            container.add(coinIcon);
          }
        }
      };
      scene.textures.on('addtexture', onTextureAdd);
    }

    // Coin text (on the right) — Logo Blue, 18px base (DPR-scaled)
    const coinText = scene.add.text(scale(15), 0, coins.toString(), {
      fontFamily: FONT_FAMILY,
      fontSize: scaleFontSize(18),
      color: '#3658EC',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    coinText.setName('coinText'); // so BaseScene can find it
    container.add(coinText);

    return container;
  }

  /**
   * Create a tooltip with blue bird icon
   */
  static createTooltip(
    scene: Phaser.Scene,
    text: string,
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    container.setDepth(200); // Higher than coin counter
    container.setAlpha(0); // Start invisible
    container.setName('coinTooltip');

    const tooltipWidth = scale(320);
    const cornerRadius = scale(20);
    const paddingX = scale(14);
    const paddingY = scale(14);
    const textStartX = scale(80);
    const textAreaWidth = tooltipWidth - textStartX - paddingX;

    // --- Measure text first so we can size the background to fit ---
    const rewardsShopMarker = 'rewards shop!';
    const markerIndex = text.toLowerCase().indexOf(rewardsShopMarker.toLowerCase());

    // Create text objects off-screen to measure, then reposition
    let mainTextObj: Phaser.GameObjects.Text | undefined;
    let linkObj: Phaser.GameObjects.Text | undefined;
    let plainTextObj: Phaser.GameObjects.Text | undefined;

    const textStyle = {
      fontFamily: 'Onest, Arial, sans-serif',
      fontSize: scaleFontSize(15),
      color: COLORS.TEXT_SECONDARY,
      wordWrap: { width: textAreaWidth },
      lineSpacing: scale(4)
    };

    if (markerIndex >= 0) {
      const beforeText = text.substring(0, markerIndex).trimEnd();
      const linkText = text.substring(markerIndex, markerIndex + rewardsShopMarker.length);

      mainTextObj = scene.add.text(0, 0, beforeText, textStyle);
      linkObj = scene.add.text(0, 0, linkText, {
        fontFamily: 'Onest, Arial, sans-serif',
        fontSize: scaleFontSize(15),
        color: `#${COLORS.LOGO_BLUE.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold'
      });
    } else {
      plainTextObj = scene.add.text(0, 0, text, textStyle);
    }

    // Calculate required height
    const contentHeight = mainTextObj && linkObj
      ? mainTextObj.height + scale(4) + linkObj.height
      : (plainTextObj?.height ?? 0);

    const birdSize = scale(54);
    const minContentHeight = birdSize; // At least as tall as the bird icon
    const actualContentHeight = Math.max(contentHeight, minContentHeight);
    const tooltipHeight = actualContentHeight + paddingY * 2;

    // --- Draw background ---
    const background = scene.add.graphics();
    background.fillStyle(COLORS.PURE_WHITE, 1);
    background.fillRoundedRect(0, 0, tooltipWidth, tooltipHeight, cornerRadius);
    background.lineStyle(scale(2), COLORS.UNAVAILABLE_BUTTON, 0.3);
    background.strokeRoundedRect(0, 0, tooltipWidth, tooltipHeight, cornerRadius);
    container.add(background);

    // --- Bird icon centred vertically ---
    const birdX = scale(45);
    const birdY = tooltipHeight / 2;
    if (scene.textures.exists(ASSET_KEYS.BIRD_CELEBRATION)) {
      const birdIcon = scene.add.image(birdX, birdY, ASSET_KEYS.BIRD_CELEBRATION);
      birdIcon.setDisplaySize(birdSize, birdSize);
      container.add(birdIcon);
    } else {
      const onTextureAdd = (key: string) => {
        if (key === ASSET_KEYS.BIRD_CELEBRATION) {
          scene.textures.off('addtexture', onTextureAdd);
          if (container && container.scene) {
            const birdIcon = scene.add.image(birdX, birdY, ASSET_KEYS.BIRD_CELEBRATION);
            birdIcon.setDisplaySize(birdSize, birdSize);
            container.add(birdIcon);
          }
        }
      };
      scene.textures.on('addtexture', onTextureAdd);
    }

    // --- Position text content centred vertically ---
    const textBlockTop = (tooltipHeight - contentHeight) / 2;

    if (mainTextObj && linkObj) {
      mainTextObj.setPosition(textStartX, textBlockTop);
      mainTextObj.setOrigin(0, 0);
      container.add(mainTextObj);

      linkObj.setPosition(textStartX, textBlockTop + mainTextObj.height + scale(4));
      linkObj.setOrigin(0, 0);
      linkObj.setInteractive({ useHandCursor: true });
      linkObj.on('pointerover', () => {
        linkObj!.setStyle({ textDecoration: 'underline' });
      });
      linkObj.on('pointerout', () => {
        linkObj!.setStyle({ textDecoration: 'none' });
      });
      linkObj.on('pointerdown', () => {
        window.dispatchEvent(new CustomEvent('navigate-to', { detail: '/app/rewards' }));
      });
      container.add(linkObj);
    } else if (plainTextObj) {
      plainTextObj.setPosition(textStartX, tooltipHeight / 2);
      plainTextObj.setOrigin(0, 0.5);
      container.add(plainTextObj);
    }

    // Store dimensions and link reference so the parent can set up hit areas
    container.setData('tooltipWidth', tooltipWidth);
    container.setData('tooltipHeight', tooltipHeight);
    if (linkObj) {
      container.setData('linkObj', linkObj);
    }

    return container;
  }

  /**
   * Create a coin counter with tooltip functionality
   */
  static createCoinCounterWithTooltip(
    scene: Phaser.Scene,
    coins: number,
    x: number,
    y: number
  ): { counter: Phaser.GameObjects.Container; tooltip: Phaser.GameObjects.Container } {
    // Create coin counter
    const counter = UIComponents.createCoinCounter(scene, coins);
    counter.setPosition(x, y);
    counter.setInteractive(new Phaser.Geom.Rectangle(-scale(60), -scale(20), scale(120), scale(40)), Phaser.Geom.Rectangle.Contains);
    
    // Calculate tooltip position to keep it on screen
    const { width } = scene.scale;
    const tooltipWidth = scale(320);
    
    // Position tooltip below and to the left of counter, but keep on screen
    let tooltipX = x - tooltipWidth + scale(60); // Align right edge near coin counter
    const tooltipY = y + scale(25); // Position below counter
    
    // Make sure tooltip doesn't go off left edge
    if (tooltipX < scale(10)) {
      tooltipX = scale(10);
    }
    
    // Make sure tooltip doesn't go off right edge
    if (tooltipX + tooltipWidth > width - scale(10)) {
      tooltipX = width - tooltipWidth - scale(10);
    }
    
    // Create tooltip positioned to stay on screen
    const tooltip = UIComponents.createTooltip(
      scene,
      'Earn coins as you learn and redeem them for rewards in the rewards shop!',
      tooltipX,
      tooltipY
    );

    // --- Make tooltip interactive so user can hover over it and click the link ---
    // We use a hit area covering the full tooltip background
    const tooltipHitArea = new Phaser.Geom.Rectangle(0, 0, tooltipWidth, tooltip.getData('tooltipHeight') || scale(100));
    tooltip.setInteractive(tooltipHitArea, Phaser.Geom.Rectangle.Contains);

    // Shared hide timer — gives the user time to move from counter → tooltip
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const HIDE_DELAY = 300; // ms grace period

    const showTooltip = () => {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      scene.tweens.add({
        targets: tooltip,
        alpha: 1,
        duration: 200,
        ease: 'Power2'
      });
    };

    const scheduleHide = () => {
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        scene.tweens.add({
          targets: tooltip,
          alpha: 0,
          duration: 200,
          ease: 'Power2'
        });
        hideTimer = null;
      }, HIDE_DELAY);
    };

    // Counter hover
    counter.on('pointerover', showTooltip);
    counter.on('pointerout', scheduleHide);

    // Tooltip hover — cancel hide while user is on the tooltip
    tooltip.on('pointerover', showTooltip);
    tooltip.on('pointerout', scheduleHide);

    // Link inside tooltip — keep tooltip visible while hovering/clicking the link
    const tooltipLink = tooltip.getData('linkObj') as Phaser.GameObjects.Text | undefined;
    if (tooltipLink) {
      tooltipLink.on('pointerover', showTooltip);
      tooltipLink.on('pointerout', scheduleHide);
    }

    return { counter, tooltip };
  }

  /**
   * Create a status badge (e.g., "Completed", "Locked")
   */
  static createBadge(
    scene: Phaser.Scene,
    text: string,
    backgroundColor: number = COLORS.STATUS_GREEN,
    textColor: string = COLORS.TEXT_WHITE_HEX
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);

    // Badge background
    const badge = scene.add.rectangle(0, 0, scale(100), scale(28), backgroundColor);
    badge.setStrokeStyle(scale(1), COLORS.PURE_WHITE);
    container.add(badge);

    // Badge text
    const badgeText = scene.add.text(0, 0, text, 
      createTextStyle('BADGE', textColor)
    ).setOrigin(0.5);
    container.add(badgeText);

    return container;
  }

  /**
   * Create a circular icon container
   */
  static createIconCircle(
    scene: Phaser.Scene,
    icon: string,
    backgroundColor: number = COLORS.LOGO_BLUE,
    radius: number = 32,
    iconColor: string = COLORS.TEXT_WHITE_HEX
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);

    // Circle background
    const circle = scene.add.circle(0, 0, scale(radius), backgroundColor);
    container.add(circle);

    // Icon
    const iconText = scene.add.text(0, 0, icon, {
      fontSize: `${scaleFontSize(32)}px`,
      fontFamily: FONT_FAMILY,
      color: iconColor,
    }).setOrigin(0.5);
    container.add(iconText);

    return container;
  }

  /**
   * Create a title text element
   */
  static createTitle(
    scene: Phaser.Scene,
    text: string,
    fontSize: number = 28,
    color: string = COLORS.TEXT_PRIMARY
  ): Phaser.GameObjects.Text {
    // Determine which preset to use based on size
    const styleKey = fontSize >= 45 ? 'H1' : fontSize >= 30 ? 'H2' : 'BODY_BOLD';
    
    return scene.add.text(0, 0, text, 
      createTextStyle(styleKey, color, { fontSize: `${scaleFontSize(fontSize)}px` })
    ).setOrigin(0.5);
  }

  /**
   * Create a subtitle text element
   */
  static createSubtitle(
    scene: Phaser.Scene,
    text: string,
    fontSize: number = 16,
    color: string = COLORS.TEXT_SECONDARY
  ): Phaser.GameObjects.Text {
    return scene.add.text(0, 0, text, 
      createTextStyle('BODY_LIGHT', color, { fontSize: `${scaleFontSize(fontSize)}px` })
    ).setOrigin(0.5);
  }

  /**
   * Create a lesson type tag (e.g., "Video", "Quiz", "Reading")
   */
  static createLessonTypeTag(
    scene: Phaser.Scene,
    type: string
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);

    // Tag background
    const tagBg = scene.add.rectangle(0, 0, scale(120), scale(24), COLORS.UNAVAILABLE_BUTTON);
    container.add(tagBg);

    // Tag text
    const tagText = scene.add.text(0, 0, type,
      createTextStyle('TAG', COLORS.TEXT_SECONDARY)
    ).setOrigin(0.5);
    container.add(tagText);

    return container;
  }

  /**
   * Create a checkmark icon
   */
  static createCheckmark(
    scene: Phaser.Scene,
    size: number = 24,
    color: string = COLORS.TEXT_SUCCESS
  ): Phaser.GameObjects.Text {
    return scene.add.text(0, 0, '✓', {
      fontSize: `${scaleFontSize(size)}px`,
      fontFamily: FONT_FAMILY,
      color: color,
    }).setOrigin(0.5);
  }

  /**
   * Create a lock icon
   */
  static createLockIcon(
    scene: Phaser.Scene,
    size: number = 24,
    color: string = COLORS.TEXT_SECONDARY
  ): Phaser.GameObjects.Text {
    return scene.add.text(0, 0, '🔒', {
      fontSize: `${scaleFontSize(size)}px`,
      fontFamily: FONT_FAMILY,
      color: color,
    }).setOrigin(0.5);
  }

  /**
   * Create a subtitle text element with custom alignment
   */
  static createBodyText(
    scene: Phaser.Scene,
    text: string,
    fontSize: number = 16,
    color: string = COLORS.TEXT_SECONDARY,
    align: string = 'center'
  ): Phaser.GameObjects.Text {
    return scene.add.text(0, 0, text, 
      createTextStyle('BODY_LIGHT', color, { 
        fontSize: `${scaleFontSize(fontSize)}px`,
        align: align
      })
    ).setOrigin(0.5);
  }

  /**
   * Create a loading progress bar
   */
  static createProgressBar(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 320,
    height: number = 50
  ): {
    box: Phaser.GameObjects.Graphics;
    bar: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
  } {
    // Progress box (background)
    const progressBox = scene.add.graphics();
    progressBox.fillStyle(COLORS.PROGRESS_BOX, 0.8);
    progressBox.fillRect(x - width / 2, y - height / 2, width, height);

    // Progress bar (fill)
    const progressBar = scene.add.graphics();

    // Percentage text
    const percentText = scene.add.text(x, y, '0%',
      createTextStyle('LABEL', COLORS.TEXT_WHITE_HEX)
    ).setOrigin(0.5);

    return {
      box: progressBox,
      bar: progressBar,
      text: percentText,
    };
  }

  /**
   * Update progress bar value
   */
  static updateProgressBar(
    progressBar: Phaser.GameObjects.Graphics,
    percentText: Phaser.GameObjects.Text,
    value: number,
    x: number,
    y: number,
    width: number = 300,
    height: number = 30
  ): void {
    progressBar.clear();
    progressBar.fillStyle(COLORS.PROGRESS_BAR, 1);
    progressBar.fillRect(x - width / 2, y - height / 2, width * value, height);
    percentText.setText(Math.floor(value * 100) + '%');
  }

  /**
   * Create a coin counter display with animation support
   */
  static createAnimatedCoinCounter(
    scene: Phaser.Scene,
    coins: number
  ): Phaser.GameObjects.Container {
    const container = UIComponents.createCoinCounter(scene, coins);
    
    // Add entrance animation
    container.setScale(0);
    scene.tweens.add({
      targets: container,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    return container;
  }

  /**
   * Create warning text
   */
  static createWarningText(
    scene: Phaser.Scene,
    text: string,
    fontSize: number = 16
  ): Phaser.GameObjects.Text {
    return scene.add.text(0, 0, text,
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_WARNING, {
        fontSize: `${scaleFontSize(fontSize)}px`
      })
    ).setOrigin(0.5);
  }

  /**
   * Create success text
   */
  static createSuccessText(
    scene: Phaser.Scene,
    text: string,
    fontSize: number = 16
  ): Phaser.GameObjects.Text {
    return scene.add.text(0, 0, text,
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_SUCCESS, {
        fontSize: `${scaleFontSize(fontSize)}px`
      })
    ).setOrigin(0.5);
  }
}