import { createGesture } from 'js-gesture';
import source from './vanilla.ts?raw';

const area = document.querySelector<HTMLElement>('#gesture-area');
const result = document.querySelector<HTMLOutputElement>('#result');
const sourceCode = document.querySelector<HTMLElement>('#source-code');

if (!area || !result || !sourceCode) throw new Error('Demo elements are missing');

sourceCode.textContent = source;

const show = (message: string) => { result.textContent = message; };

const gesture = createGesture(area, {
  tap: () => show('tap'),
  doubleTap: () => show('doubleTap'),
  longPress: () => show('longPress'),
  panMove: ({ deltaX, deltaY }) => show(`pan: ${Math.round(deltaX)}, ${Math.round(deltaY)}`),
  swipeLeft: () => show('swipeLeft'),
  swipeRight: () => show('swipeRight'),
  swipeUp: () => show('swipeUp'),
  swipeDown: () => show('swipeDown'),
  pinch: ({ scale }) => show(`pinch: ${scale.toFixed(2)}×`),
  rotate: ({ rotation }) => show(`rotate: ${rotation.toFixed(1)}°`),
});

window.addEventListener('pagehide', () => gesture.destroy(), { once: true });
