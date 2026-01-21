import Phaser from 'phaser';
import PreloaderScene from '../scenes/PreloaderScene';
import MapScene from '../scenes/MapScene';
import NeighborhoodScene from '../scenes/NeighborhoodScene';
import HouseScene from '../scenes/HouseScene';
import GrowYourNestMinigame from '../scenes/minigames/GrowYourNestMinigame';

export const createGameConfig = (parent: HTMLElement): Phaser.Types.Core.GameConfig => {
  const dpr = window.devicePixelRatio || 1;
  const baseWidth = window.innerWidth - 192;
  const baseHeight = window.innerHeight;

  return {
    type: Phaser.WEBGL,
    parent: parent,
    width: baseWidth * dpr,
    height: baseHeight * dpr,
    transparent: true,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    // All scenes but don't auto-start any
    scene: [
      PreloaderScene, 
      MapScene, 
      NeighborhoodScene, 
      HouseScene,
      GrowYourNestMinigame
    ],
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      zoom: 1 / dpr
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
      powerPreference: 'high-performance'
    }
  };
};