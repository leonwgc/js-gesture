import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGesture, type GestureCallbacks } from '../src/index';

function pointer(
  element: HTMLElement,
  type: string,
  x: number,
  y: number,
  id = 1,
  kind = 'touch',
  button = 0,
): void {
  const event = new Event(type, { bubbles: true }) as PointerEvent;
  Object.defineProperties(event, {
    pointerId: { value: id },
    pointerType: { value: kind },
    clientX: { value: x },
    clientY: { value: y },
    button: { value: button },
  });
  element.dispatchEvent(event);
}

describe('createGesture', () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    element = document.createElement('div');
    document.body.append(element);
  });

  afterEach(() => {
    element.remove();
    vi.useRealTimers();
  });

  it('delays tap until the double-tap window closes', () => {
    const tap = vi.fn();
    const gesture = createGesture(element, { tap });
    pointer(element, 'pointerdown', 10, 20);
    pointer(element, 'pointerup', 10, 20);
    expect(tap).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(tap).toHaveBeenCalledOnce();
    expect(tap.mock.calls[0][0]).toMatchObject({
      type: 'tap', x: 10, y: 20, deltaX: 0, pointerType: 'touch',
    });
    gesture.destroy();
  });

  it('emits doubleTap without either tap', () => {
    const tap = vi.fn();
    const doubleTap = vi.fn();
    const gesture = createGesture(element, { tap, doubleTap });
    pointer(element, 'pointerdown', 10, 20);
    pointer(element, 'pointerup', 10, 20);
    vi.advanceTimersByTime(100);
    pointer(element, 'pointerdown', 14, 20);
    pointer(element, 'pointerup', 14, 20);
    vi.advanceTimersByTime(300);
    expect(tap).not.toHaveBeenCalled();
    expect(doubleTap).toHaveBeenCalledOnce();
    gesture.destroy();
  });

  it('keeps distant taps separate', () => {
    const tap = vi.fn();
    const doubleTap = vi.fn();
    const gesture = createGesture(element, { tap, doubleTap });
    pointer(element, 'pointerdown', 0, 0);
    pointer(element, 'pointerup', 0, 0);
    vi.advanceTimersByTime(100);
    pointer(element, 'pointerdown', 100, 0);
    pointer(element, 'pointerup', 100, 0);
    expect(tap).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(300);
    expect(tap).toHaveBeenCalledTimes(2);
    expect(doubleTap).not.toHaveBeenCalled();
    gesture.destroy();
  });

  it('fires longPress once and suppresses tap', () => {
    const longPress = vi.fn();
    const tap = vi.fn();
    const gesture = createGesture(element, { longPress, tap });
    pointer(element, 'pointerdown', 1, 2);
    vi.advanceTimersByTime(500);
    expect(longPress).toHaveBeenCalledOnce();
    pointer(element, 'pointerup', 1, 2);
    vi.advanceTimersByTime(300);
    expect(tap).not.toHaveBeenCalled();
    gesture.destroy();
  });

  it('cancels longPress after movement beyond tap tolerance', () => {
    const longPress = vi.fn();
    const gesture = createGesture(element, { longPress }, { panThreshold: 30 });
    pointer(element, 'pointerdown', 0, 0);
    pointer(element, 'pointermove', 11, 0);
    vi.advanceTimersByTime(600);
    expect(longPress).not.toHaveBeenCalled();
    gesture.destroy();
  });

  it('rejects a tap that moves too far or lasts too long', () => {
    const tap = vi.fn();
    const gesture = createGesture(element, { tap }, { panThreshold: 30 });
    pointer(element, 'pointerdown', 0, 0);
    pointer(element, 'pointermove', 11, 0);
    pointer(element, 'pointerup', 11, 0);
    pointer(element, 'pointerdown', 0, 0);
    vi.advanceTimersByTime(300);
    pointer(element, 'pointerup', 0, 0);
    vi.advanceTimersByTime(300);
    expect(tap).not.toHaveBeenCalled();
    gesture.destroy();
  });

  it('does not combine mouse and touch taps into a doubleTap', () => {
    const tap = vi.fn();
    const doubleTap = vi.fn();
    const gesture = createGesture(element, { tap, doubleTap });
    pointer(element, 'pointerdown', 0, 0, 1, 'mouse');
    pointer(element, 'pointerup', 0, 0, 1, 'mouse');
    pointer(element, 'pointerdown', 0, 0, 2, 'touch');
    pointer(element, 'pointerup', 0, 0, 2, 'touch');
    vi.advanceTimersByTime(300);
    expect(tap).toHaveBeenCalledTimes(2);
    expect(doubleTap).not.toHaveBeenCalled();
    gesture.destroy();
  });

  it.each([
    ['swipeLeft', -60, 0, 'left'],
    ['swipeRight', 60, 0, 'right'],
    ['swipeUp', 0, -60, 'up'],
    ['swipeDown', 0, 60, 'down'],
  ] as const)('emits pan lifecycle and %s', (name, dx, dy, direction) => {
    const order: string[] = [];
    const callbacks: GestureCallbacks = {
      panStart: () => order.push('panStart'),
      panMove: () => order.push('panMove'),
      panEnd: () => order.push('panEnd'),
      [name]: (event: unknown) => {
        expect(event).toMatchObject({ direction, distance: 60 });
        order.push(name);
      },
    };
    const gesture = createGesture(element, callbacks);
    pointer(element, 'pointerdown', 100, 100);
    vi.advanceTimersByTime(100);
    pointer(element, 'pointermove', 100 + dx, 100 + dy);
    pointer(element, 'pointerup', 100 + dx, 100 + dy);
    expect(order).toEqual(['panStart', 'panMove', 'panEnd', name]);
    gesture.destroy();
  });

  it('recognizes a swipe when the final coordinate changes only on pointerup', () => {
    const swipeLeft = vi.fn();
    const gesture = createGesture(element, { swipeLeft });
    pointer(element, 'pointerdown', 100, 0);
    pointer(element, 'pointerup', 0, 0);
    expect(swipeLeft).toHaveBeenCalledOnce();
    gesture.destroy();
  });

  it('does not emit a swipe for a slow drag', () => {
    const swipeRight = vi.fn();
    const panEnd = vi.fn();
    const gesture = createGesture(element, { swipeRight, panEnd });
    pointer(element, 'pointerdown', 0, 0);
    pointer(element, 'pointermove', 60, 0);
    vi.advanceTimersByTime(501);
    pointer(element, 'pointerup', 60, 0);
    expect(panEnd).toHaveBeenCalledOnce();
    expect(swipeRight).not.toHaveBeenCalled();
    gesture.destroy();
  });

  it('reports cancellation without swipe or tap', () => {
    const panEnd = vi.fn();
    const swipeRight = vi.fn();
    const tap = vi.fn();
    const gesture = createGesture(element, { panEnd, swipeRight, tap });
    pointer(element, 'pointerdown', 0, 0);
    pointer(element, 'pointermove', 60, 0);
    pointer(element, 'pointercancel', 60, 0);
    vi.advanceTimersByTime(500);
    expect(panEnd).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true }));
    expect(swipeRight).not.toHaveBeenCalled();
    expect(tap).not.toHaveBeenCalled();
    gesture.destroy();
  });

  it('ends an active pan as cancelled when a second pointer arrives', () => {
    const panEnd = vi.fn();
    const swipeRight = vi.fn();
    const gesture = createGesture(element, { panEnd, swipeRight });
    pointer(element, 'pointerdown', 0, 0, 1);
    pointer(element, 'pointermove', 60, 0, 1);
    pointer(element, 'pointerdown', 10, 0, 2);
    pointer(element, 'pointerup', 60, 0, 1);
    pointer(element, 'pointerup', 10, 0, 2);
    expect(panEnd).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true }));
    expect(swipeRight).not.toHaveBeenCalled();
    gesture.destroy();
  });

  it('treats lost pointer capture as cancellation', () => {
    const panEnd = vi.fn();
    const gesture = createGesture(element, { panEnd });
    pointer(element, 'pointerdown', 0, 0);
    pointer(element, 'pointermove', 20, 0);
    pointer(element, 'lostpointercapture', 20, 0);
    expect(panEnd).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true }));
    gesture.destroy();
  });

  it('reports scale and rotation for two simultaneous pointers', () => {
    const pinch = vi.fn();
    const rotate = vi.fn();
    const tap = vi.fn();
    const gesture = createGesture(element, { pinch, rotate, tap });
    pointer(element, 'pointerdown', 0, 0, 1);
    pointer(element, 'pointerdown', 10, 0, 2);
    pointer(element, 'pointermove', 0, 20, 2);
    expect(pinch).toHaveBeenCalledWith(expect.objectContaining({ scale: 2, x: 0, y: 10 }));
    expect(rotate).toHaveBeenCalledWith(expect.objectContaining({ rotation: 90 }));
    pointer(element, 'pointerup', 0, 20, 2);
    pointer(element, 'pointerup', 0, 0, 1);
    vi.advanceTimersByTime(300);
    expect(tap).not.toHaveBeenCalled();
    gesture.destroy();
  });

  it('ignores non-primary mouse buttons', () => {
    const tap = vi.fn();
    const gesture = createGesture(element, { tap });
    pointer(element, 'pointerdown', 0, 0, 1, 'mouse', 2);
    pointer(element, 'pointerup', 0, 0, 1, 'mouse', 2);
    vi.advanceTimersByTime(300);
    expect(tap).not.toHaveBeenCalled();
    gesture.destroy();
  });

  it('supports on/off and unsubscribe', () => {
    const gesture = createGesture(element);
    const tap = vi.fn();
    const unsubscribe = gesture.on('tap', tap);
    pointer(element, 'pointerdown', 0, 0);
    pointer(element, 'pointerup', 0, 0);
    vi.advanceTimersByTime(300);
    expect(tap).toHaveBeenCalledOnce();
    unsubscribe();
    gesture.off('tap', tap);
    pointer(element, 'pointerdown', 0, 0);
    pointer(element, 'pointerup', 0, 0);
    vi.advanceTimersByTime(300);
    expect(tap).toHaveBeenCalledOnce();
    gesture.destroy();
  });

  it('restores touch-action and clears timers on destroy', () => {
    element.style.touchAction = 'pan-y';
    const tap = vi.fn();
    const gesture = createGesture(element, { tap });
    expect(element.style.touchAction).toBe('none');
    pointer(element, 'pointerdown', 0, 0);
    pointer(element, 'pointerup', 0, 0);
    gesture.destroy();
    gesture.destroy();
    expect(element.style.touchAction).toBe('pan-y');
    vi.advanceTimersByTime(1000);
    expect(tap).not.toHaveBeenCalled();
    expect(() => gesture.on('tap', tap)).toThrow('destroyed');
  });

  it('clears an active long-press timer and ignores later pointer events on destroy', () => {
    const longPress = vi.fn();
    const gesture = createGesture(element, { longPress });
    pointer(element, 'pointerdown', 0, 0);
    gesture.destroy();
    vi.advanceTimersByTime(1000);
    pointer(element, 'pointerdown', 0, 0);
    expect(longPress).not.toHaveBeenCalled();
  });

  it('allows leaving touch-action unchanged and customizing thresholds', () => {
    element.style.touchAction = 'pan-x';
    const swipeRight = vi.fn();
    const gesture = createGesture(element, { swipeRight }, {
      touchAction: null, swipeMinDistance: 20, panThreshold: 5,
    });
    expect(element.style.touchAction).toBe('pan-x');
    pointer(element, 'pointerdown', 0, 0);
    pointer(element, 'pointermove', 25, 0);
    pointer(element, 'pointerup', 25, 0);
    expect(swipeRight).toHaveBeenCalledOnce();
    gesture.destroy();
    expect(element.style.touchAction).toBe('pan-x');
  });
});
