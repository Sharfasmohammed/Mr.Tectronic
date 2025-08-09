import { useState, useCallback, useRef, useEffect } from "react";

interface Bubble {
  id: number;
  popped: boolean;
}

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'game'>('landing');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [poppedCount, setPoppedCount] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize bubbles grid
  useEffect(() => {
    if (currentView === 'game') {
      const initialBubbles: Bubble[] = [];
      for (let i = 0; i < 200; i++) {
        initialBubbles.push({ id: i, popped: false });
      }
      setBubbles(initialBubbles);
    }
  }, [currentView]);

  // Initialize audio context
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };
    
    // Initialize on first user interaction
    const handleFirstInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Create pop sound
  const playPopSound = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContextRef.current.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
  }, []);

  const popBubble = useCallback((id: number) => {
    setBubbles(prev => 
      prev.map(bubble => 
        bubble.id === id && !bubble.popped 
          ? { ...bubble, popped: true }
          : bubble
      )
    );
    
    setPoppedCount(prev => prev + 1);
    playPopSound();
    
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [playPopSound]);

  const resetBubbles = useCallback(() => {
    setBubbles(prev => prev.map(bubble => ({ ...bubble, popped: false })));
    setPoppedCount(0);
  }, []);

  const openGame = useCallback(() => {
    setCurrentView('game');
  }, []);

  const backToLanding = useCallback(() => {
    setCurrentView('landing');
    setPoppedCount(0);
  }, []);

  if (currentView === 'landing') {
    return <LandingPage onOpen={openGame} />;
  }

  const totalBubbles = bubbles.length;
  const progressPercentage = totalBubbles > 0 ? (poppedCount / totalBubbles) * 100 : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={backToLanding}
                className="text-white hover:text-gray-300 transition-colors duration-200"
                aria-label="Back to home"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Sharfas Popper</h1>
                <p className="text-gray-400 text-sm">Pop away your stress</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-white">
                {poppedCount} / {totalBubbles}
              </div>
              <div className="text-sm text-gray-400">bubbles popped</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex justify-center mb-8">
          <button
            onClick={resetBubbles}
            className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          >
            Reset All Bubbles
          </button>
        </div>

        {/* Bubble grid */}
        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 xl:grid-cols-20 gap-1 sm:gap-2 justify-center bubble-grid">
          {bubbles.map((bubble) => (
            <BubbleComponent
              key={bubble.id}
              bubble={bubble}
              onPop={() => popBubble(bubble.id)}
            />
          ))}
        </div>

        {/* Completion message */}
        {poppedCount === totalBubbles && totalBubbles > 0 && (
          <div className="mt-8 text-center">
            <div className="inline-block p-6 bg-white text-black rounded-lg">
              <h2 className="text-2xl font-bold mb-2">🎉 All Popped!</h2>
              <p className="text-gray-800">You've popped all {totalBubbles} bubbles!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LandingPage({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Bubble Icon */}
        <div className="mb-12 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center animate-float">
              <svg 
                className="w-12 h-12 text-black" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <circle cx="8" cy="8" r="3" opacity="0.8"/>
                <circle cx="16" cy="8" r="2" opacity="0.6"/>
                <circle cx="12" cy="16" r="2.5" opacity="0.7"/>
                <circle cx="6" cy="16" r="1.5" opacity="0.5"/>
                <circle cx="18" cy="16" r="1.5" opacity="0.5"/>
              </svg>
            </div>
            {/* Floating mini bubbles */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full opacity-60 animate-pulse"></div>
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-white rounded-full opacity-40 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold mb-4 tracking-tight">
          Sharfas Popper
        </h1>
        
        {/* Subtitle */}
        <p className="text-gray-400 text-lg mb-12 leading-relaxed">
          Pop away your stress with satisfying bubble wrap sounds and smooth animations
        </p>

        {/* Open Button */}
        <button
          onClick={onOpen}
          className="px-12 py-4 bg-white text-black text-lg font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black shadow-lg"
        >
          Open
        </button>

        {/* Footer text */}
        <p className="text-gray-600 text-sm mt-16">
          Click bubbles to pop them and enjoy the satisfying sounds
        </p>
      </div>
    </div>
  );
}

interface BubbleComponentProps {
  bubble: Bubble;
  onPop: () => void;
}

function BubbleComponent({ bubble, onPop }: BubbleComponentProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handlePop = useCallback(() => {
    if (bubble.popped) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      onPop();
      setIsAnimating(false);
    }, 150);
  }, [bubble.popped, onPop]);

  return (
    <button
      onClick={handlePop}
      disabled={bubble.popped}
      className={`
        aspect-square w-full max-w-[40px] rounded-full transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-black
        ${bubble.popped 
          ? 'bg-gray-800 scale-75 opacity-50 cursor-not-allowed' 
          : 'bg-white hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl cursor-pointer'
        }
        ${isAnimating ? 'animate-pulse scale-125' : ''}
      `}
      style={{
        background: bubble.popped 
          ? '#1f1f1f' 
          : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,1), rgba(240,240,240,0.9))',
        boxShadow: bubble.popped 
          ? 'none' 
          : '0 4px 15px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.8)'
      }}
      aria-label={`Bubble ${bubble.id + 1} ${bubble.popped ? 'popped' : 'ready to pop'}`}
    >
      {!bubble.popped && (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-white/30 to-transparent" />
      )}
    </button>
  );
}
