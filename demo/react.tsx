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

  return <main>
    <a href="../">← All demos</a>
    <h1>React</h1>
    <p>The gesture instance is tied to the component lifecycle.</p>
    <div ref={areaRef} className="gesture-area" tabIndex={0} aria-label="Gesture area">
      <span className="gesture-area__title">Try a gesture here</span>
      <span className="gesture-area__hint">Tap · hold · drag · swipe · use two fingers</span>
    </div>
    <output className="result" aria-live="polite">{result}</output>
    <section className="source">
      <h2>Source code</h2>
      <pre><code>{source}</code></pre>
    </section>
  </main>;
}

const root = document.getElementById('root');
if (!root) throw new Error('React demo root is missing');
createRoot(root).render(<App />);
