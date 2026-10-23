# js-gesture

A small TypeScript gesture detector for a single DOM element. It uses Pointer Events, so the same API handles mouse, touch, and pen input. The package ships native ESM JavaScript and TypeScript declarations.

## Install and use

Once published, install it with `npm install js-gesture`. For local integration before publishing, build this repository and install it with `npm install /path/to/js-gesture`.

```ts
import { createGesture } from 'js-gesture';

const element = document.querySelector<HTMLElement>('#gesture-area');
if (!element) throw new Error('Gesture area not found');

const gesture = createGesture(element, {
  swipeLeft: ({ deltaX, velocityX }) => {
    console.log('swipeLeft', deltaX, velocityX);
  },
  pinch: ({ scale }) => console.log('scale', scale),
});

const unsubscribe = gesture.on('tap', ({ x, y }) => console.log(x, y));
unsubscribe(); // or gesture.off('tap', listener)
gesture.destroy(); // call when removing the element
```

`createGesture(element, callbacks?, options?)` returns a `GestureController` with `on`, `off`, and `destroy`. Callback keys and `on/off` names are identical. Each callback receives a typed event. `on` returns an unsubscribe function. `destroy` removes listeners, clears timers, and restores the element's previous inline `touch-action` value.

## Events

| Event | When it fires |
| --- | --- |
| `tap` | One short tap, after the double-tap window closes. |
| `doubleTap` | Two nearby short taps within the window; no `tap` for either. |
| `longPress` | A pointer stays down without moving beyond the tap tolerance. |
| `panStart`, `panMove`, `panEnd` | One-pointer drag after the pan threshold. `panEnd.cancelled` indicates a cancelled pointer. |
| `swipeLeft`, `swipeRight`, `swipeUp`, `swipeDown` | A pan ends quickly and exceeds the dominant-axis swipe distance. `panEnd` fires first. |
| `pinch` | Two pointers move; `scale` is relative to their initial distance (`1` means unchanged). |
| `rotate` | Two pointers move; `rotation` is degrees relative to their initial angle, in `[-180, 180)`. |

Single-pointer events include `type`, `x`, `y`, `startX`, `startY`, `deltaX`, `deltaY`, `duration` (ms), `velocityX`, `velocityY` (px/ms), `pointerType`, and `originalEvent`. Swipe events add `direction` and dominant-axis `distance`. `pinch` and `rotate` include the center `x/y`, `pointerType`, and `originalEvent`. Right mouse button presses are ignored. A two-pointer sequence does not also produce tap, pan, or swipe events.

## Options

| Option | Default | Meaning |
| --- | ---: | --- |
| `panThreshold` | `10` | Minimum drag distance in px. |
| `swipeMinDistance` | `50` | Minimum dominant-axis distance in px. |
| `swipeMaxDuration` | `500` | Maximum swipe duration in ms. |
| `tapMaxDistance` | `10` | Maximum movement for tap/long press in px. |
| `tapMaxDuration` | `250` | Maximum tap duration in ms. |
| `doubleTapDelay` | `300` | Time between completed taps in ms. |
| `doubleTapMaxDistance` | `24` | Maximum distance between taps in px. |
| `longPressDelay` | `500` | Hold duration in ms. |
| `touchAction` | `'none'` | Inline CSS value; `null` leaves the element unchanged. |

By default, the library sets `touch-action: none` on the bound element so browsers deliver all four swipe directions and two-pointer gestures. This disables native scrolling and browser zoom gestures **inside that element**. Set `touchAction: 'pan-y'` when vertical page scrolling matters more than vertical gesture detection, or `null` to manage CSS yourself. `destroy()` restores the previous inline value.

## Demos and development

```bash
npm install
npm run build
npm run typecheck
npm test
npm run demo:build
npm run demo
```

Open the URL printed by Vite to choose the native DOM, React, or Vue 3 demo. All three examples use `createGesture` and dispose of the instance at the appropriate lifecycle boundary. The demo imports the local source through a Vite alias; consumers import the package as shown above.

The package targets browsers with Pointer Events support. It does not polyfill older browsers. Mouse input supports one-pointer gestures; pinch and rotate require two simultaneous pointers.
