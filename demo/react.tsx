import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createGesture } from 'js-gesture';
import source from './react.tsx?raw';

function App() {
  const areaRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState('Waiting for a gesture…');

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const gesture = createGesture(area, {
      tap: () => setResult('tap'),
      doubleTap: () => setResult('doubleTap'),
      longPress: () => setResult('longPress'),
      panMove: ({ deltaX, deltaY }) => setResult(`pan: ${Math.round(deltaX)}, ${Math.round(deltaY)}`),
      swipeLeft: () => setResult('swipeLeft'),
      swipeRight: () => setResult('swipeRight'),
      swipeUp: () => setResult('swipeUp'),
      swipeDown: () => setResult('swipeDown'),
      pinch: ({ scale }) => setResult(`pinch: ${scale.toFixed(2)}×`),
      rotate: ({ rotation }) => setResult(`rotate: ${rotation.toFixed(1)}°`),
    });
    return () => gesture.destroy();
  }, []);

  return <>
    <div className="announcement"><span className="announcement__mark">✦</span> POINTER EVENTS · TYPESCRIPT · ESM <span aria-hidden="true">↗</span></div>
    <header className="site-header">
      <a className="brand" href="../" aria-label="js-gesture home"><span className="brand__icon">↗</span> JS-GESTURE<span className="brand__dot">.</span></a>
      <nav className="site-nav" aria-label="Main navigation"><a href="../#examples">Examples</a><a href="https://github.com/leonwgc/js-gesture">GitHub <span aria-hidden="true">↗</span></a></nav>
    </header>
    <main className="demo-page">
      <div className="demo-heading"><a className="back-link" href="../#examples">← All examples</a><p className="eyebrow">02 / React</p><h1>Gesture meets component<span>.</span></h1><p>The gesture instance is tied to the component lifecycle.</p></div>
      <div className="demo-grid">
        <section className="playground" aria-labelledby="playground-title">
          <div className="panel-heading"><h2 id="playground-title">Playground</h2><span>LIVE DEMO <i /></span></div>
          <div ref={areaRef} className="gesture-area" tabIndex={0} aria-label="Gesture area">
            <span className="gesture-area__symbol" aria-hidden="true">↗</span>
            <span className="gesture-area__title">Try a gesture here</span>
            <span className="gesture-area__hint">Tap · hold · drag · swipe · use two fingers</span>
          </div>
          <div className="result-row"><span>DETECTED EVENT</span><output className="result" aria-live="polite">{result}</output></div>
        </section>
        <section className="source" aria-labelledby="source-title">
          <div className="panel-heading"><h2 id="source-title">Source code</h2><span>REACT + TYPESCRIPT</span></div>
          <pre><code>{source}</code></pre>
        </section>
      </div>
    </main>
  </>;
}

const root = document.getElementById('root');
if (!root) throw new Error('React demo root is missing');
createRoot(root).render(<App />);
