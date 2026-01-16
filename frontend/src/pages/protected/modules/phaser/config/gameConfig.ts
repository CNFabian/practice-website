import Phaser from 'phaser';
import PreloaderScene from '../scenes/PreloaderScene';
import MapScene from '../scenes/MapScene';
import NeighborhoodScene from '../scenes/NeighborhoodScene';
import HouseScene from '../scenes/HouseScene';

export const createGameConfig = (parent: HTMLElement): Phaser.Types.Core.GameConfig => {
  // Calculate the proper dimensions accounting for device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  const baseWidth = window.innerWidth - 192;
  const baseHeight = window.innerHeight;

  return {
    type: Phaser.WEBGL, // Use WEBGL for better performance
    parent: parent,
    // Set canvas dimensions to account for device pixel ratio
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
    // PreloaderScene MUST be first - it loads all assets once
    scene: [PreloaderScene, MapScene, NeighborhoodScene, HouseScene],
    scale: {
      mode: Phaser.Scale.NONE, // Manual control for high DPI
      autoCenter: Phaser.Scale.CENTER_BOTH,
      // Zoom inversely to DPR so visual size stays correct
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