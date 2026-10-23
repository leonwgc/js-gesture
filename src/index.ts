export type PointerKind = 'mouse' | 'touch' | 'pen';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface GestureBase {
  x: number;
  y: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  duration: number;
  velocityX: number;
  velocityY: number;
  pointerType: PointerKind;
  originalEvent: PointerEvent;
}

export interface SingleGestureEvent<Name extends string> extends GestureBase {
  type: Name;
}

export interface PanGestureEvent<Name extends string> extends SingleGestureEvent<Name> {
  cancelled: boolean;
}

export interface SwipeGestureEvent<Name extends string> extends SingleGestureEvent<Name> {
  direction: SwipeDirection;
  distance: number;
}

export interface PinchGestureEvent {
  type: 'pinch';
  x: number;
  y: number;
  scale: number;
  pointerType: PointerKind;
  originalEvent: PointerEvent;
}

export interface RotateGestureEvent {
  type: 'rotate';
  x: number;
  y: number;
  rotation: number;
  pointerType: PointerKind;
  originalEvent: PointerEvent;
}

export interface GestureEventMap {
  tap: SingleGestureEvent<'tap'>;
  doubleTap: SingleGestureEvent<'doubleTap'>;
  longPress: SingleGestureEvent<'longPress'>;
  panStart: PanGestureEvent<'panStart'>;
  panMove: PanGestureEvent<'panMove'>;
  panEnd: PanGestureEvent<'panEnd'>;
  swipeLeft: SwipeGestureEvent<'swipeLeft'>;
  swipeRight: SwipeGestureEvent<'swipeRight'>;
  swipeUp: SwipeGestureEvent<'swipeUp'>;
  swipeDown: SwipeGestureEvent<'swipeDown'>;
  pinch: PinchGestureEvent;
  rotate: RotateGestureEvent;
}

export type GestureName = keyof GestureEventMap;
export type GestureListener<Name extends GestureName> = (event: GestureEventMap[Name]) => void;
export type GestureCallbacks = Partial<{ [Name in GestureName]: GestureListener<Name> }>;

export interface GestureOptions {
  /** Movement in pixels before pan begins. Default: 10. */
  panThreshold?: number;
  /** Minimum dominant-axis distance in pixels for a swipe. Default: 50. */
  swipeMinDistance?: number;
  /** Maximum swipe duration in milliseconds. Default: 500. */
  swipeMaxDuration?: number;
  /** Maximum movement in pixels for a tap or long press. Default: 10. */
  tapMaxDistance?: number;
  /** Maximum tap duration in milliseconds. Default: 250. */
  tapMaxDuration?: number;
  /** Time between completed taps in milliseconds. Default: 300. */
  doubleTapDelay?: number;
  /** Maximum distance between two taps in pixels. Default: 24. */
  doubleTapMaxDistance?: number;
  /** Time held before longPress fires in milliseconds. Default: 500. */
  longPressDelay?: number;
  /** Applied inline to the element. null leaves it untouched. Default: 'none'. */
  touchAction?: string | null;
}

interface PointerPosition {
  x: number;
  y: number;
  kind: PointerKind;
}

interface SingleStart extends PointerPosition {
  id: number;
  time: number;
}

interface MultiStart {
  distance: number;
  angle: number;
}

interface PendingTap {
  event: GestureEventMap['tap'];
  time: number;
  timer: ReturnType<typeof setTimeout>;
}

const defaults: Required<GestureOptions> = {
  panThreshold: 10,
  swipeMinDistance: 50,
  swipeMaxDuration: 500,
  tapMaxDistance: 10,
  tapMaxDuration: 250,
  doubleTapDelay: 300,
  doubleTapMaxDistance: 24,
  longPressDelay: 500,
  touchAction: 'none',
};

const names: GestureName[] = [
  'tap', 'doubleTap', 'longPress', 'panStart', 'panMove', 'panEnd',
  'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'pinch', 'rotate',
];

function swipeName(direction: SwipeDirection):
  'swipeLeft' | 'swipeRight' | 'swipeUp' | 'swipeDown' {
  switch (direction) {
    case 'left': return 'swipeLeft';
    case 'right': return 'swipeRight';
    case 'up': return 'swipeUp';
    case 'down': return 'swipeDown';
  }
}

function distance(x: number, y: number): number {
  return Math.hypot(x, y);
}

function pointerKind(event: PointerEvent): PointerKind {
  if (event.pointerType === 'touch' || event.pointerType === 'pen') return event.pointerType;
  return 'mouse';
}

/** Binds pointer gestures to one element. Call destroy() when it is removed. */
export class GestureController {
  private readonly element: HTMLElement;
  private readonly options: Required<GestureOptions>;
  private readonly previousTouchAction: string;
  private readonly pointers = new Map<number, PointerPosition>();
  private readonly handlers: { [Name in GestureName]: Set<GestureListener<Name>> } = {
    tap: new Set(),
    doubleTap: new Set(),
    longPress: new Set(),
    panStart: new Set(),
    panMove: new Set(),
    panEnd: new Set(),
    swipeLeft: new Set(),
    swipeRight: new Set(),
    swipeUp: new Set(),
    swipeDown: new Set(),
    pinch: new Set(),
    rotate: new Set(),
  };
  private singleStart: SingleStart | null = null;
  private multiStart: MultiStart | null = null;
  private pendingTap: PendingTap | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private panActive = false;
  private longPressed = false;
  private suppressSingleUntilClear = false;
  private destroyed = false;

  constructor(element: HTMLElement, callbacks: GestureCallbacks = {}, options: GestureOptions = {}) {
    this.element = element;
    this.options = { ...defaults, ...options };
    this.previousTouchAction = element.style.touchAction;
    const register = <Name extends GestureName>(name: Name): void => {
      const callback = callbacks[name];
      if (callback) this.on(name, callback);
    };
    for (const name of names) register(name);

    if (this.options.touchAction !== null) element.style.touchAction = this.options.touchAction;
    element.addEventListener('pointerdown', this.handleDown);
    element.addEventListener('pointermove', this.handleMove);
    element.addEventListener('pointerup', this.handleUp);
    element.addEventListener('pointercancel', this.handleCancel);
    element.addEventListener('lostpointercapture', this.handleCancel);
  }

  on<Name extends GestureName>(name: Name, listener: GestureListener<Name>): () => void {
    if (this.destroyed) throw new Error('GestureController has been destroyed');
    this.handlers[name].add(listener);
    return () => this.off(name, listener);
  }

  off<Name extends GestureName>(name: Name, listener: GestureListener<Name>): void {
    this.handlers[name].delete(listener);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.element.removeEventListener('pointerdown', this.handleDown);
    this.element.removeEventListener('pointermove', this.handleMove);
    this.element.removeEventListener('pointerup', this.handleUp);
    this.element.removeEventListener('pointercancel', this.handleCancel);
    this.element.removeEventListener('lostpointercapture', this.handleCancel);
    this.clearLongPress();
    this.clearPendingTap();
    this.pointers.clear();
    for (const name of names) this.handlers[name].clear();
    if (this.options.touchAction !== null) this.element.style.touchAction = this.previousTouchAction;
  }

  private emit<Name extends GestureName>(name: Name, event: GestureEventMap[Name]): void {
    for (const handler of this.handlers[name]) handler(event);
  }

  private handleDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (this.pointers.has(event.pointerId)) return;

    this.pointers.set(event.pointerId, {
      x: event.clientX, y: event.clientY, kind: pointerKind(event),
    });

    try {
      this.element.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic events and detached elements may not have an active pointer.
    }

    if (this.pointers.size === 1 && !this.suppressSingleUntilClear) {
      this.singleStart = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        kind: pointerKind(event),
        time: Date.now(),
      };
      this.longPressed = false;
      this.panActive = false;
      this.longPressTimer = setTimeout(() => {
        const start = this.singleStart;
        const point = start && this.pointers.get(start.id);
        if (!start || !point || this.panActive || this.suppressSingleUntilClear) return;
        this.longPressed = true;
        this.emit('longPress', this.singleEvent('longPress', start, point, event));
      }, this.options.longPressDelay);
      return;
    }

    this.clearLongPress();
    if (this.panActive && this.singleStart) {
      const previous = this.pointers.get(this.singleStart.id);
      if (previous) {
        this.emit('panEnd', {
          ...this.singleEvent('panEnd', this.singleStart, previous, event),
          cancelled: true,
        });
      }
      this.panActive = false;
    }
    this.singleStart = null;
    this.suppressSingleUntilClear = true;
    if (this.pointers.size === 2) this.resetMultiStart();
    else this.multiStart = null;
  };

  private handleMove = (event: PointerEvent): void => {
    if (!this.pointers.has(event.pointerId)) return;
    const point = { x: event.clientX, y: event.clientY, kind: pointerKind(event) };
    this.pointers.set(event.pointerId, point);

    if (this.pointers.size === 2 && this.multiStart) {
      const [first, second] = [...this.pointers.values()];
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const x = (first.x + second.x) / 2;
      const y = (first.y + second.y) / 2;
      const scale = distance(dx, dy) / this.multiStart.distance;
      const rawRotation = Math.atan2(dy, dx) * 180 / Math.PI - this.multiStart.angle;
      const rotation = ((rawRotation + 540) % 360) - 180;
      this.emit('pinch', { type: 'pinch', x, y, scale, pointerType: point.kind, originalEvent: event });
      this.emit('rotate', { type: 'rotate', x, y, rotation, pointerType: point.kind, originalEvent: event });
      return;
    }

    const start = this.singleStart;
    if (!start || start.id !== event.pointerId || this.suppressSingleUntilClear) return;
    const moved = distance(point.x - start.x, point.y - start.y);
    if (moved > this.options.tapMaxDistance) this.clearLongPress();
    if (moved < this.options.panThreshold && !this.panActive) return;

    if (!this.panActive) {
      this.panActive = true;
      this.clearLongPress();
      this.emit('panStart', { ...this.singleEvent('panStart', start, point, event), cancelled: false });
    }
    this.emit('panMove', { ...this.singleEvent('panMove', start, point, event), cancelled: false });
  };

  private handleUp = (event: PointerEvent): void => {
    const point = this.pointers.get(event.pointerId);
    if (!point) return;
    if (!this.suppressSingleUntilClear && this.singleStart?.id === event.pointerId
      && (point.x !== event.clientX || point.y !== event.clientY)) {
      this.handleMove(event);
    }
    const end = { x: event.clientX, y: event.clientY, kind: point.kind };
    this.pointers.delete(event.pointerId);
    this.clearLongPress();

    if (this.suppressSingleUntilClear) {
      if (this.pointers.size === 2) this.resetMultiStart();
      if (this.pointers.size === 0) this.resetGesture();
      return;
    }

    const start = this.singleStart;
    if (!start || start.id !== event.pointerId) return;
    const base = this.singleEvent('tap', start, end, event);
    const elapsed = base.duration;
    const moved = distance(base.deltaX, base.deltaY);

    if (this.panActive) {
      this.emit('panEnd', { ...base, type: 'panEnd', cancelled: false });
      const dominant = Math.max(Math.abs(base.deltaX), Math.abs(base.deltaY));
      if (dominant >= this.options.swipeMinDistance && elapsed <= this.options.swipeMaxDuration) {
        const direction: SwipeDirection = Math.abs(base.deltaX) >= Math.abs(base.deltaY)
          ? (base.deltaX < 0 ? 'left' : 'right')
          : (base.deltaY < 0 ? 'up' : 'down');
        const name = swipeName(direction);
        this.emit(name, { ...base, type: name, direction, distance: dominant });
      }
    } else if (!this.longPressed && moved <= this.options.tapMaxDistance && elapsed <= this.options.tapMaxDuration) {
      this.registerTap(base);
    }
    this.resetGesture();
  };

  private handleCancel = (event: PointerEvent): void => {
    const point = this.pointers.get(event.pointerId);
    if (!point) return;
    this.pointers.delete(event.pointerId);
    this.clearLongPress();
    if (this.panActive && this.singleStart?.id === event.pointerId) {
      this.emit('panEnd', {
        ...this.singleEvent('panEnd', this.singleStart, point, event),
        cancelled: true,
      });
    }
    this.panActive = false;
    this.singleStart = null;
    this.suppressSingleUntilClear = this.pointers.size > 0;
    if (this.pointers.size === 2) this.resetMultiStart();
    else this.multiStart = null;
    if (this.pointers.size === 0) this.resetGesture();
  };

  private singleEvent<Name extends string>(
    type: Name, start: SingleStart, point: PointerPosition, originalEvent: PointerEvent,
  ): SingleGestureEvent<Name> {
    const duration = Math.max(0, Date.now() - start.time);
    const deltaX = point.x - start.x;
    const deltaY = point.y - start.y;
    return {
      type, x: point.x, y: point.y, startX: start.x, startY: start.y,
      deltaX, deltaY, duration,
      velocityX: duration > 0 ? deltaX / duration : 0,
      velocityY: duration > 0 ? deltaY / duration : 0,
      pointerType: start.kind, originalEvent,
    };
  }

  private registerTap(event: GestureEventMap['tap']): void {
    const pending = this.pendingTap;
    if (pending) {
      this.clearPendingTap();
      const near = distance(event.x - pending.event.x, event.y - pending.event.y)
        <= this.options.doubleTapMaxDistance;
      if (Date.now() - pending.time <= this.options.doubleTapDelay
        && near && event.pointerType === pending.event.pointerType) {
        this.emit('doubleTap', { ...event, type: 'doubleTap' });
        return;
      }
      this.emit('tap', pending.event);
    }

    const timer = setTimeout(() => {
      if (this.pendingTap?.timer !== timer) return;
      this.pendingTap = null;
      this.emit('tap', event);
    }, this.options.doubleTapDelay);
    this.pendingTap = { event, time: Date.now(), timer };
  }

  private resetMultiStart(): void {
    const [first, second] = [...this.pointers.values()];
    const dx = second.x - first.x;
    const dy = second.y - first.y;
    this.multiStart = {
      distance: Math.max(distance(dx, dy), Number.EPSILON),
      angle: Math.atan2(dy, dx) * 180 / Math.PI,
    };
  }

  private resetGesture(): void {
    this.singleStart = null;
    this.multiStart = null;
    this.panActive = false;
    this.longPressed = false;
    this.suppressSingleUntilClear = false;
  }

  private clearLongPress(): void {
    if (this.longPressTimer !== null) clearTimeout(this.longPressTimer);
    this.longPressTimer = null;
  }

  private clearPendingTap(): void {
    if (this.pendingTap) clearTimeout(this.pendingTap.timer);
    this.pendingTap = null;
  }
}

export function createGesture(
  element: HTMLElement, callbacks: GestureCallbacks = {}, options: GestureOptions = {},
): GestureController {
  return new GestureController(element, callbacks, options);
}
