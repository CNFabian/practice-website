import Phaser from 'phaser';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
import { COLORS, OPACITY } from '../constants/Colors';
import { createTextStyle } from '../constants/Typography';

export interface LockedHouseTooltipConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  previousHouseName: string;
  houseContainer: Phaser.GameObjects.Container;
}

export class LockedHouseTooltip {
  /**
   * Create a tooltip for locked houses with hover interaction
   */
  static create(config: LockedHouseTooltipConfig): Phaser.GameObjects.Container {
    const { scene, x, y, previousHouseName, houseContainer } = config;

    // Create tooltip container (initially hidden)
    const tooltipContainer = scene.add.container(x, y - scale(120));
    tooltipContainer.setAlpha(0);
    tooltipContainer.setDepth(20); // Above everything

    // Tooltip dimensions
    const tooltipWidth = scale(300);
    const tooltipHeight = scale(90);

    // Tooltip background - white with high opacity to match card style
    const tooltipBg = scene.add.rectangle(
      0,
      0,
      tooltipWidth,
      tooltipHeight,
      COLORS.WHITE,
      OPACITY.HIGH
    );
    tooltipBg.setStrokeStyle(scale(2), COLORS.GRAY_200);
    tooltipContainer.add(tooltipBg);

    // Lock icon using standard icon circle style
    const lockIconBg = scene.add.circle(0, scale(-25), scale(20), COLORS.GRAY_300);
    tooltipContainer.add(lockIconBg);

    const lockIcon = scene.add.text(0, scale(-25), '🔒', {
      fontSize: scaleFontSize(18),
    }).setOrigin(0.5);
    tooltipContainer.add(lockIcon);

    // Tooltip text - using standard text colors
    const tooltipText = scene.add.text(
      0,
      scale(15),
      `Complete ${previousHouseName}\nto unlock this house`,
      createTextStyle('CAPTION', COLORS.TEXT_SECONDARY, {
        fontSize: scaleFontSize(13),
        align: 'center',
        wordWrap: { width: tooltipWidth - scale(20) },
      })
    ).setOrigin(0.5);
    tooltipContainer.add(tooltipText);

    // Add pointer triangle at bottom - white to match background
    const triangle = scene.add.triangle(
      0,
      tooltipHeight / 2,
      0, 0,
      scale(10), scale(12),
      scale(-10), scale(12),
      COLORS.WHITE
    );
    tooltipContainer.add(triangle);

    // Add triangle border for depth
    const triangleBorder = scene.add.triangle(
      0,
      tooltipHeight / 2 + scale(1),
      0, 0,
      scale(11), scale(13),
      scale(-11), scale(13),
      COLORS.GRAY_200
    );
    triangleBorder.setDepth(-1);
    tooltipContainer.add(triangleBorder);

    // Setup interactivity
    LockedHouseTooltip.setupInteractivity(scene, houseContainer, tooltipContainer);

    return tooltipContainer;
  }

  /**
   * Setup hover interactions for the tooltip
   */
  private static setupInteractivity(
    scene: Phaser.Scene,
    houseContainer: Phaser.GameObjects.Container,
    tooltipContainer: Phaser.GameObjects.Container
  ): void {
    // Make house container interactive with explicit size
    const houseSize = scale(200);
    houseContainer.setSize(houseSize, houseSize);
    houseContainer.setInteractive();
    
    // Show tooltip on hover
    houseContainer.on('pointerover', () => {
      scene.tweens.add({
        targets: tooltipContainer,
        alpha: 1,
        duration: 200,
        ease: 'Power2',
      });
    });

    // Hide tooltip on pointer out
    houseContainer.on('pointerout', () => {
      scene.tweens.add({
        targets: tooltipContainer,
        alpha: 0,
        duration: 200,
        ease: 'Power2',
      });
    });

    // Prevent click action on locked houses - add bounce animation
    houseContainer.on('pointerdown', () => {
      scene.tweens.add({
        targets: houseContainer,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2',
      });
    });
  }
}