export { default as GalleryEnvironment } from './GalleryEnvironment';
export { default as BeachEnvironment } from './BeachEnvironment';
export { default as ForestEnvironment } from './ForestEnvironment';

// Environment metadata
export const ENVIRONMENTS = [
  {
    id: 'gallery',
    label: 'Sunset Meadow',
    description: 'Padang rumput senja yang hangat dan menenangkan',
    icon: '🌅',
    color: '#ff7043',
  },
  {
    id: 'beach',
    label: 'Pantai',
    description: 'Pantai yang menenangkan dengan suara ombak',
    icon: '🏖️',
    color: '#4fc3f7',
  },
  {
    id: 'forest',
    label: 'Hutan',
    description: 'Hutan yang sejuk dengan kunang-kunang',
    icon: '🌲',
    color: '#66bb6a',
  },
];
