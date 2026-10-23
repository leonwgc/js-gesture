<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { createGesture, type GestureController } from 'js-gesture';

const area = ref<HTMLElement | null>(null);
const result = ref('Waiting for a gesture…');
let gesture: GestureController | undefined;

onMounted(() => {
  if (!area.value) return;
  gesture = createGesture(area.value, {
    tap: () => { result.value = 'tap'; },
    doubleTap: () => { result.value = 'doubleTap'; },
    longPress: () => { result.value = 'longPress'; },
    panMove: ({ deltaX, deltaY }) => {
      result.value = `pan: ${Math.round(deltaX)}, ${Math.round(deltaY)}`;
    },
    swipeLeft: () => { result.value = 'swipeLeft'; },
    swipeRight: () => { result.value = 'swipeRight'; },
    swipeUp: () => { result.value = 'swipeUp'; },
    swipeDown: () => { result.value = 'swipeDown'; },
    pinch: ({ scale }) => { result.value = `pinch: ${scale.toFixed(2)}×`; },
    rotate: ({ rotation }) => { result.value = `rotate: ${rotation.toFixed(1)}°`; },
  });
});

onBeforeUnmount(() => gesture?.destroy());
</script>

<template>
  <main>
    <a href="/">← All demos</a>
    <h1>Vue 3</h1>
    <p>The gesture instance is tied to the component lifecycle.</p>
    <div ref="area" class="gesture-area" tabindex="0" aria-label="Gesture area">Gesture area</div>
    <output class="result" aria-live="polite">{{ result }}</output>
  </main>
</template>
