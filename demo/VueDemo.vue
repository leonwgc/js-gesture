<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { createGesture, type GestureController } from 'js-gesture';
import source from './VueDemo.vue?raw';

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
  <div class="announcement"><span class="announcement__mark">✦</span> POINTER EVENTS · TYPESCRIPT · ESM <span aria-hidden="true">↗</span></div>
  <header class="site-header">
    <a class="brand" href="../" aria-label="js-gesture home"><span class="brand__icon">↗</span> JS-GESTURE<span class="brand__dot">.</span></a>
    <nav class="site-nav" aria-label="Main navigation"><a href="../#examples">Examples</a><a href="https://github.com/leonwgc/js-gesture">GitHub <span aria-hidden="true">↗</span></a></nav>
  </header>
  <main class="demo-page">
    <div class="demo-heading"><a class="back-link" href="../#examples">← All examples</a><p class="eyebrow">03 / Vue 3</p><h1>Gesture meets Vue<span>.</span></h1><p>The gesture instance is tied to the component lifecycle.</p></div>
    <div class="demo-grid">
      <section class="playground" aria-labelledby="playground-title">
        <div class="panel-heading"><h2 id="playground-title">Playground</h2><span>LIVE DEMO <i /></span></div>
        <div ref="area" class="gesture-area" tabindex="0" aria-label="Gesture area">
          <span class="gesture-area__symbol" aria-hidden="true">↗</span>
          <span class="gesture-area__title">Try a gesture here</span>
          <span class="gesture-area__hint">Tap · hold · drag · swipe · use two fingers</span>
        </div>
        <div class="result-row"><span>DETECTED EVENT</span><output class="result" aria-live="polite">{{ result }}</output></div>
      </section>
      <section class="source" aria-labelledby="source-title">
        <div class="panel-heading"><h2 id="source-title">Source code</h2><span>VUE + TYPESCRIPT</span></div>
        <pre><code>{{ source }}</code></pre>
      </section>
    </div>
  </main>
</template>
