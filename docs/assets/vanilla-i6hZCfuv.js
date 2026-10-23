/* empty css              */import{t as e}from"./src-w1Eju7-U.js";var t=`import { createGesture } from 'js-gesture';
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
  panMove: ({ deltaX, deltaY }) => show(\`pan: \${Math.round(deltaX)}, \${Math.round(deltaY)}\`),
  swipeLeft: () => show('swipeLeft'),
  swipeRight: () => show('swipeRight'),
  swipeUp: () => show('swipeUp'),
  swipeDown: () => show('swipeDown'),
  pinch: ({ scale }) => show(\`pinch: \${scale.toFixed(2)}×\`),
  rotate: ({ rotation }) => show(\`rotate: \${rotation.toFixed(1)}°\`),
});

window.addEventListener('pagehide', () => gesture.destroy(), { once: true });
`,n=document.querySelector(`#gesture-area`),r=document.querySelector(`#result`),i=document.querySelector(`#source-code`);if(!n||!r||!i)throw Error(`Demo elements are missing`);i.textContent=t;var a=e=>{r.textContent=e},o=e(n,{tap:()=>a(`tap`),doubleTap:()=>a(`doubleTap`),longPress:()=>a(`longPress`),panMove:({deltaX:e,deltaY:t})=>a(`pan: ${Math.round(e)}, ${Math.round(t)}`),swipeLeft:()=>a(`swipeLeft`),swipeRight:()=>a(`swipeRight`),swipeUp:()=>a(`swipeUp`),swipeDown:()=>a(`swipeDown`),pinch:({scale:e})=>a(`pinch: ${e.toFixed(2)}×`),rotate:({rotation:e})=>a(`rotate: ${e.toFixed(1)}°`)});window.addEventListener(`pagehide`,()=>o.destroy(),{once:!0});