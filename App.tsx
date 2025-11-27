import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { ArrowDown, Zap, Server, Clock, Copy, Check, Radio } from 'lucide-react';
import { isPrime, findPreviousPrimes } from './services/mathService';
import { loadState, GENESIS_EPOCH } from './services/persistenceService';

const BATCH_SIZE = 100;
const SYNC_THRESHOLD = 50;
const MAX_BUFFER_SIZE = 5000;

const App: React.FC = () => {
  const [currentPrime, setCurrentPrime] = useState<bigint>(2n);
  const [displayedHistory, setDisplayedHistory] = useState<(bigint | string)[]>([]);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  
  const searchCursor = useRef<bigint>(2n);
  const fullHistoryRef = useRef<(bigint | string)[]>([]);
  const historyRenderCount = useRef<number>(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(false);

  useEffect(() => {
    // Connect to the "Global Stream" via time synchronization
    const { startPrime } = loadState();
    
    searchCursor.current = startPrime;
    setCurrentPrime(startPrime);

    // Pre-calculate the immediate history so the stream feels alive on join
    const initialBuffer = findPreviousPrimes(startPrime, 100);
    
    // Add a connection marker instead of offline marker
    fullHistoryRef.current = [...initialBuffer];
    fullHistoryRef.current.push(`CONNECTION_ESTABLISHED:${Date.now()}`);

    historyRenderCount.current = fullHistoryRef.current.length;
    setDisplayedHistory([...fullHistoryRef.current]);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const totalAvailable = fullHistoryRef.current.length;
          const currentRendered = historyRenderCount.current;

          if (currentRendered < totalAvailable) {
            const nextCount = Math.min(currentRendered + BATCH_SIZE, totalAvailable);
            historyRenderCount.current = nextCount;
            setDisplayedHistory(fullHistoryRef.current.slice(0, nextCount));
          }
        }
      },
      { 
        threshold: 0.1,
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [displayedHistory]);

  useEffect(() => {
    let isRunning = true;

    const findNext = () => {
      if (!isRunning) return;

      let candidate = searchCursor.current + 1n;
      
      if (candidate > 2n && candidate % 2n === 0n) candidate++;
      
      while (!isPrime(candidate)) {
        candidate += 2n; 
      }

      searchCursor.current = candidate;
      fullHistoryRef.current.push(candidate);

      if (fullHistoryRef.current.length > MAX_BUFFER_SIZE) {
        fullHistoryRef.current.shift();
        if (historyRenderCount.current > 0) {
          historyRenderCount.current--;
        }
      }

      setCurrentPrime(candidate);

      if (historyRenderCount.current === 0 && fullHistoryRef.current.length > 0) {
         historyRenderCount.current = Math.min(fullHistoryRef.current.length, BATCH_SIZE);
         setDisplayedHistory(fullHistoryRef.current.slice(0, historyRenderCount.current));
      }

      setTimeout(findNext, 0);
    };

    findNext();

    return () => { isRunning = false; };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAtBottomRef.current) return;

      const total = fullHistoryRef.current.length;
      const current = historyRenderCount.current;
      const diff = total - current;

      if (diff <= 0) return;

      let itemsToAdd = 0;

      if (diff > 500) {
        itemsToAdd = 100;
      } else if (diff > 100) {
        itemsToAdd = 20;
      } else {
        itemsToAdd = Math.max(1, Math.ceil(diff / 10));
      }

      const nextCount = current + itemsToAdd;
      historyRenderCount.current = nextCount;
      setDisplayedHistory(fullHistoryRef.current.slice(0, nextCount));

    }, 30);

    return () => clearInterval(interval);
  }, []);

  useLayoutEffect(() => {
    if (isAtBottomRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [displayedHistory]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
  };

  const historyGroups = useMemo(() => {
    const groups: { type: 'numbers' | 'marker'; digits?: number; items: (bigint | string)[] }[] = [];
    if (displayedHistory.length === 0) return groups;

    let currentGroup: { type: 'numbers' | 'marker'; digits?: number; items: (bigint | string)[] } | null = null;

    for (const item of displayedHistory) {
      if (typeof item === 'string' && item.startsWith('CONNECTION')) {
        if (currentGroup) groups.push(currentGroup);
        groups.push({ type: 'marker', items: [item] });
        currentGroup = null;
        continue;
      }

      if (typeof item === 'string' && item.startsWith('OFFLINE')) {
        if (currentGroup) groups.push(currentGroup);
        groups.push({ type: 'marker', items: [item] });
        currentGroup = null;
        continue;
      }

      const val = item as bigint;
      const digits = val.toString().length;

      if (currentGroup && currentGroup.type === 'numbers' && currentGroup.digits === digits) {
        currentGroup.items.push(val);
      } else {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = { type: 'numbers', digits, items: [val] };
      }
    }
    
    if (currentGroup) groups.push(currentGroup);
    return groups;
  }, [displayedHistory]);

  const renderMarker = (markerString: string, index: number) => {
    if (markerString.startsWith('CONNECTION')) {
      return (
        <div key={`marker-${index}`} className="w-full py-6 my-2 border-y border-emerald-900/30 bg-emerald-950/10 flex flex-col items-center justify-center text-emerald-400 text-sm rounded-xl backdrop-blur-sm animate-fade-in col-span-full">
          <div className="flex items-center gap-3 text-emerald-300">
            <div className="p-2 bg-emerald-500/10 rounded-full animate-pulse">
               <Radio size={18} />
            </div>
            <span className="font-bold tracking-wider">CONNECTED TO GLOBAL STREAM</span>
          </div>
          <div className="flex items-center gap-2 mt-2 opacity-60 font-mono text-xs">
            <Clock size={12} />
            <span>Synchronized with Universal Time Protocol</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPrime.toString());
    setShowCopyFeedback(true);
    setTimeout(() => setShowCopyFeedback(false), 2000);
  };

  const isLive = displayedHistory.length >= fullHistoryRef.current.length - SYNC_THRESHOLD;

  // Format Genesis Date
  const genesisDate = new Date(GENESIS_EPOCH).toLocaleString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="h-screen w-full bg-black text-white font-mono selection:bg-emerald-500 selection:text-black flex flex-col overflow-y-scroll"
    >
      <div className="fixed top-0 left-0 w-full p-4 flex justify-between items-start z-50 mix-blend-difference pointer-events-none">
        <div className="flex flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-widest text-emerald-500 animate-pulse">
            <Zap size={14} fill="currentColor" />
            SYSTEM ACTIVE
          </div>
          <div className="h-3 w-[1px] bg-neutral-800"></div>
          <div className="text-[9px] text-neutral-600 font-mono tracking-wide">
            GENESIS: {genesisDate}
          </div>
        </div>
        <div className="text-[10px] sm:text-xs text-neutral-500 font-mono pt-1">
          BUFFER: {fullHistoryRef.current.length} / {MAX_BUFFER_SIZE}
        </div>
      </div>

      <div className="h-screen w-full flex flex-col items-center justify-center relative shrink-0">
        <div className="absolute top-1/4 text-neutral-700 text-xs sm:text-sm uppercase tracking-[0.5em]">
          Current Prime
        </div>
        
        <button 
          onClick={handleCopy}
          className="group relative appearance-none bg-transparent border-none cursor-pointer active:scale-95 transition-transform duration-100"
          aria-label="Copy current prime number"
        >
          <div className="text-[15vw] sm:text-[12vw] md:text-[10vw] leading-none font-bold tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] tabular-nums group-hover:text-emerald-100 transition-colors">
            {currentPrime.toLocaleString()}
          </div>

          <div className={`absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-emerald-500 text-black text-sm font-bold px-4 py-2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300 ${showCopyFeedback ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <Check size={16} strokeWidth={3} />
            COPIED!
          </div>
          
          <div className={`absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity duration-300 ${showCopyFeedback ? 'hidden' : 'block'}`}>
            <Copy size={32} />
          </div>
        </button>
        
        <div className="absolute bottom-10 flex flex-col items-center gap-3 text-neutral-700 animate-bounce opacity-60 pointer-events-none">
          <span className="text-[9px] uppercase tracking-[0.3em]">Log Stream</span>
          <ArrowDown size={20} />
        </div>
      </div>

      <div className="min-h-screen w-full bg-[#050505] border-t border-neutral-900/50 shadow-[0_-20px_50px_rgba(0,0,0,1)] z-10 relative pt-8 pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
          <div className="flex items-center justify-between mb-2 sticky top-0 bg-[#050505] z-40 pt-12 pb-4 px-4 -mx-4 sm:px-8 sm:-mx-8 border-b border-neutral-900 shadow-2xl">
             <h2 className="text-xs font-bold text-neutral-600 uppercase tracking-widest">
              Computed Log
            </h2>
            <div className={`w-2 h-2 rounded-full animate-pulse transition-colors duration-500 ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
          </div>
          
          <div className="flex flex-col gap-[1px]">
            {historyGroups.map((group, groupIdx) => {
              if (group.type === 'marker') {
                return renderMarker(group.items[0] as string, groupIdx);
              }

              const digitCount = group.digits || 1;
              const minColWidth = (digitCount * 11) + 12; 
              
              return (
                <div 
                  key={groupIdx} 
                  className="grid gap-x-1 gap-y-[1px] w-full"
                  style={{ 
                    gridTemplateColumns: `repeat(auto-fill, minmax(${minColWidth}px, 1fr))` 
                  }}
                >
                  {group.items.map((item, itemIdx) => (
                    <div 
                      key={`${groupIdx}-${itemIdx}`}
                      className="
                        font-mono text-base sm:text-lg 
                        text-neutral-500 hover:text-emerald-400 hover:bg-neutral-900/80
                        transition-all duration-200 
                        cursor-default select-all 
                        tabular-nums text-right 
                        border border-transparent hover:border-neutral-800 
                        rounded-sm px-1 py-[1px] bg-neutral-900/20
                      "
                    >
                      {(item as bigint).toLocaleString()}
                    </div>
                  ))}
                </div>
              );
            })}

            <div ref={observerTarget} className="w-full h-32 flex flex-col items-center justify-start pt-8 text-neutral-800 text-xs tracking-widest uppercase">
              {!isLive ? (
                <span className="animate-pulse flex items-center gap-2 text-amber-600/50">
                  <div className="w-1 h-1 bg-amber-600 rounded-full"/> SYNCING HISTORY ({(fullHistoryRef.current.length - displayedHistory.length).toLocaleString()} PENDING) <div className="w-1 h-1 bg-amber-600 rounded-full"/>
                </span>
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-80">
                   <div className="flex items-center gap-2 text-emerald-500 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </div>
                      LIVE - UP TO DATE
                   </div>
                   <span className="text-[10px] text-neutral-700">Stream connected</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default App;