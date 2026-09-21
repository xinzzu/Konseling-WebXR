export { default as GalleryEnvironment } from './GalleryEnvironment';
export { default as BeachEnvironment } from './BeachEnvironment';
export { default as ForestEnvironment } from './ForestEnvironment';
export { default as Video360Environment } from './Video360Environment';

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
  {
    id: 'video-360',
    label: 'Video 360° (Sample)',
    description: 'Background video 360 derajat (eksperimen)',
    icon: '🎥',
    color: '#ab47bc',
  },
  {
    id: 'video-360-2',
    label: 'Video 360° (Sample 2)',
    description: 'Background video 360 derajat lainnya (eksperimen)',
    icon: '🎬',
    color: '#7e57c2',
  },
  {
    id: 'video-360-3',
    label: 'Video 360° (Sample 3)',
    description: 'Background video 360 derajat lainnya (eksperimen)',
    icon: '🎞️',
    color: '#26a69a',
  },
];
