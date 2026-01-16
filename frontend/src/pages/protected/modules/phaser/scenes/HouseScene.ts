import Phaser from 'phaser';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';

interface Lesson {
  id: number;
  title: string;
  type: string;
  completed: boolean;
  locked: boolean;
}

interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface HouseSceneData {
  houseId?: string;
  moduleId?: number;
}

const SAMPLE_MODULE: Module = {
  id: 1,
  title: 'Homebuying Foundations',
  lessons: [
    {
      id: 101,
      title: 'Renting vs Buying',
      type: 'Video/Reading',
      completed: false,
      locked: false,
    },
    {
      id: 102,
      title: 'Preparing Your Documents',
      type: 'Video/Reading',
      completed: true,
      locked: false,
    },
    {
      id: 103,
      title: 'Financial Basics',
      type: 'Video/Reading',
      completed: true,
      locked: false,
    },
    {
      id: 104,
      title: 'Setting a Timeline',
      type: 'Video/Reading',
      completed: false,
      locked: true,
    },
  ],
};

export default class HouseScene extends Phaser.Scene {
  private module: Module = SAMPLE_MODULE;
  private isTransitioning: boolean = false;
  private backButton?: Phaser.GameObjects.Container;
  private minigameButton?: Phaser.GameObjects.Container;
  private headerCard?: Phaser.GameObjects.Container;
  private lessonContainers: Phaser.GameObjects.Container[] = [];
  private background?: Phaser.GameObjects.Image;
  private leftHouse?: Phaser.GameObjects.Image;
  private rightHouse?: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'HouseScene' });
  }

  // NO preload() - assets are already loaded by PreloaderScene!

  init(_data: HouseSceneData) {
    this.isTransitioning = false;
    this.lessonContainers = [];
  }

  create() {
    const { width, height } = this.scale;

    // Create house cutouts
    this.leftHouse = this.add.image(width * 0.25, height / 2, 'leftCutHouse');
    this.leftHouse.setDepth(1);
    this.leftHouse.setScale(2);
    
    this.rightHouse = this.add.image(width * 0.76, height / 2, 'rightCutHouse');
    this.rightHouse.setDepth(1);
    this.rightHouse.setScale(2);

    this.cameras.main.fadeIn(300, 254, 243, 199);

    this.createBackButton();
    this.createMinigameButton();
    this.createHeaderCard();
    this.createLessonGrid();

    this.scale.on('resize', this.handleResize, this);
  }

  private createBackButton() {
    const buttonContainer = this.add.container(scale(100), scale(40));
    buttonContainer.setDepth(10);

    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0xffffff, 0.9);
    buttonBg.fillRoundedRect(-scale(80), -scale(20), scale(160), scale(40), scale(10));

    const arrowIcon = this.add.graphics();
    arrowIcon.lineStyle(scale(3), 0x000000);
    arrowIcon.beginPath();
    arrowIcon.moveTo(-scale(50), 0);
    arrowIcon.lineTo(-scale(35), -scale(10));
    arrowIcon.moveTo(-scale(50), 0);
    arrowIcon.lineTo(-scale(35), scale(10));
    arrowIcon.strokePath();

    const backText = this.add.text(-scale(20), 0, 'Back', {
      fontSize: scaleFontSize(16),
      color: '#000000',
      fontFamily: 'Arial'
    });
    backText.setOrigin(0, 0.5);

    buttonContainer.add([buttonBg, arrowIcon, backText]);

    const hitArea = new Phaser.Geom.Rectangle(-scale(80), -scale(20), scale(160), scale(40));
    buttonContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
      .on('pointerover', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0xffffff, 1);
        buttonBg.fillRoundedRect(-scale(80), -scale(20), scale(160), scale(40), scale(10));
      })
      .on('pointerout', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0xffffff, 0.9);
        buttonBg.fillRoundedRect(-scale(80), -scale(20), scale(160), scale(40), scale(10));
      })
      .on('pointerdown', () => {
        if (!this.isTransitioning) {
          this.handleBackToNeighborhood();
        }
      });

    this.backButton = buttonContainer;
  }

  private createMinigameButton() {
    const { width } = this.scale;

    const buttonContainer = this.add.container(width - scale(120), scale(40));
    buttonContainer.setDepth(10);

    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x10b981, 0.9);
    buttonBg.fillRoundedRect(-scale(80), -scale(20), scale(160), scale(40), scale(10));

    const gameIcon = this.add.graphics();
    gameIcon.lineStyle(scale(3), 0xffffff);
    gameIcon.strokeRoundedRect(-scale(60), -scale(8), scale(16), scale(16), scale(3));

    const buttonText = this.add.text(-scale(35), 0, 'Play Game', {
      fontSize: scaleFontSize(16),
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    buttonText.setOrigin(0, 0.5);

    buttonContainer.add([buttonBg, gameIcon, buttonText]);

    const hitArea = new Phaser.Geom.Rectangle(-scale(80), -scale(20), scale(160), scale(40));
    buttonContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
      .on('pointerover', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0x10b981, 1);
        buttonBg.fillRoundedRect(-scale(80), -scale(20), scale(160), scale(40), scale(10));
      })
      .on('pointerout', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0x10b981, 0.9);
        buttonBg.fillRoundedRect(-scale(80), -scale(20), scale(160), scale(40), scale(10));
      })
      .on('pointerdown', () => {
        if (!this.isTransitioning) {
          this.handleMinigameSelect();
        }
      });

    this.minigameButton = buttonContainer;
  }

  private createHeaderCard() {
    const { width, height } = this.scale;

    const cardContainer = this.add.container(width / 2, height * 0.15);
    cardContainer.setDepth(10);

    const cardBg = this.add.graphics();
    cardBg.fillStyle(0xffffff, 0.95);
    cardBg.fillRoundedRect(-scale(300), -scale(60), scale(600), scale(120), scale(15));

    const titleText = this.add.text(0, -scale(20), this.module.title, {
      fontSize: scaleFontSize(28),
      color: '#1f2937',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    titleText.setOrigin(0.5, 0.5);

    const statsText = this.add.text(0, scale(20), `${this.module.lessons.length} Lessons Available`, {
      fontSize: scaleFontSize(16),
      color: '#6b7280',
      fontFamily: 'Arial'
    });
    statsText.setOrigin(0.5, 0.5);

    cardContainer.add([cardBg, titleText, statsText]);

    this.headerCard = cardContainer;
  }

  private createLessonGrid() {
    const { width, height } = this.scale;
    
    const gridStartY = height * 0.35;
    const cardWidth = scale(280);
    const cardHeight = scale(100);
    const spacing = scale(20);
    const columns = 2;

    this.module.lessons.forEach((lesson, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      const x = width / 2 - cardWidth - spacing / 2 + col * (cardWidth + spacing);
      const y = gridStartY + row * (cardHeight + spacing);

      const lessonCard = this.createLessonCard(lesson, x, y, cardWidth, cardHeight);
      this.lessonContainers.push(lessonCard);
    });
  }

  private createLessonCard(
    lesson: Lesson,
    x: number,
    y: number,
    width: number,
    height: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setDepth(10);

    const cardBg = this.add.graphics();
    const bgColor = lesson.completed ? 0x10b981 : lesson.locked ? 0x9ca3af : 0x3b82f6;
    cardBg.fillStyle(bgColor, 0.9);
    cardBg.fillRoundedRect(0, 0, width, height, scale(12));

    const badgeSize = scale(35);
    const badge = this.add.graphics();
    badge.fillStyle(0xffffff, 0.3);
    badge.fillCircle(scale(20), scale(20), badgeSize / 2);

    const lessonNum = this.add.text(scale(20), scale(20), `${lesson.id - 100}`, {
      fontSize: scaleFontSize(18),
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    lessonNum.setOrigin(0.5, 0.5);

    const title = this.add.text(scale(50), scale(20), lesson.title, {
      fontSize: scaleFontSize(16),
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      wordWrap: { width: width - scale(60) }
    });
    title.setOrigin(0, 0.5);

    const type = this.add.text(scale(50), scale(50), lesson.type, {
      fontSize: scaleFontSize(13),
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    type.setOrigin(0, 0.5);

    const statusIcon = this.add.graphics();
    if (lesson.completed) {
      statusIcon.lineStyle(scale(3), 0xffffff);
      statusIcon.beginPath();
      statusIcon.moveTo(width - scale(30), height - scale(25));
      statusIcon.lineTo(width - scale(22), height - scale(15));
      statusIcon.lineTo(width - scale(10), height - scale(35));
      statusIcon.strokePath();
    } else if (lesson.locked) {
      statusIcon.lineStyle(scale(2), 0xffffff);
      statusIcon.strokeRect(width - scale(30), height - scale(25), scale(20), scale(15));
      statusIcon.strokeCircle(width - scale(20), height - scale(30), scale(8));
    }

    container.add([cardBg, badge, lessonNum, title, type, statusIcon]);

    if (!lesson.locked) {
      const hitArea = new Phaser.Geom.Rectangle(0, 0, width, height);
      container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
        .on('pointerover', () => {
          this.tweens.add({
            targets: container,
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 150,
            ease: 'Power2'
          });
        })
        .on('pointerout', () => {
          this.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            duration: 150,
            ease: 'Power2'
          });
        })
        .on('pointerdown', () => {
          if (!this.isTransitioning) {
            this.handleLessonClick(lesson.id);
          }
        });
    }

    return container;
  }

  private handleLessonClick(lessonId: number) {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    const handleLessonSelect = this.registry.get('handleLessonSelect');
    
    if (handleLessonSelect && typeof handleLessonSelect === 'function') {
      this.cameras.main.fadeOut(300, 254, 243, 199);
      
      this.cameras.main.once('camerafadeoutcomplete', () => {
        const lessonNumber = lessonId - 100;
        handleLessonSelect(`lesson-${lessonNumber}`);
        this.isTransitioning = false;
      });
    }
  }

  private handleBackToNeighborhood() {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    const handleBackToNeighborhood = this.registry.get('handleBackToNeighborhood');
    
    if (handleBackToNeighborhood && typeof handleBackToNeighborhood === 'function') {
      this.cameras.main.fadeOut(300, 254, 243, 199);
      
      this.cameras.main.once('camerafadeoutcomplete', () => {
        handleBackToNeighborhood();
        this.isTransitioning = false;
      });
    }
  }

  private handleMinigameSelect() {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    const handleMinigameSelect = this.registry.get('handleMinigameSelect');
    
    if (handleMinigameSelect && typeof handleMinigameSelect === 'function') {
      this.cameras.main.fadeOut(300, 254, 243, 199);
      
      this.cameras.main.once('camerafadeoutcomplete', () => {
        handleMinigameSelect();
        this.isTransitioning = false;
      });
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;

    if (this.background) {
      this.background.setPosition(width / 2, height / 2);
      this.background.setDisplaySize(width, height);
    }

    if (this.leftHouse) {
      this.leftHouse.setPosition(width * 0.25, height / 2);
    }
    if (this.rightHouse) {
      this.rightHouse.setPosition(width * 0.75, height / 2);
    }

    if (this.backButton) {
      this.backButton.setPosition(scale(100), scale(40));
    }

    if (this.minigameButton) {
      this.minigameButton.setPosition(width - scale(120), scale(40));
    }

    if (this.headerCard) {
      this.headerCard.setPosition(width / 2, height * 0.15);
    }

    this.lessonContainers.forEach(container => container.destroy());
    this.lessonContainers = [];
    this.createLessonGrid();
  }

  shutdown() {
    this.scale.off('resize', this.handleResize, this);
    this.lessonContainers = [];
  }
}