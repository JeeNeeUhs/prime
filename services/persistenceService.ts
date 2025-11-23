export const saveState = (_: bigint) => {
  // No-op: State is now derived from the global universal clock.
  // This simulates a server-side stream without local persistence.
};

export interface PersistenceData {
  startPrime: bigint;
  skippedCount: number;
  offlineTimeMs: number;
}

// Fixed Point in Time (Genesis Epoch)
// This ensures everyone calculates the same starting number relative to this date.
// Set to March 14, 2025, 03:14:00 UTC
export const GENESIS_EPOCH = 1741922040000; 
export const STREAM_VELOCITY = 1n; // How fast the number grows per millisecond (1n = 1000/sec)

export const loadState = (): PersistenceData => {
  const now = Date.now();
  const elapsed = BigInt(Math.max(0, now - GENESIS_EPOCH));
  
  // Calculate the Global Stream Position based on time
  // This ensures User A and User B see the exact same number at the exact same second
  let globalCursor = 2n + (elapsed * STREAM_VELOCITY);
  
  // Ensure we start on an odd number for optimization
  if (globalCursor % 2n === 0n) globalCursor += 1n;

  return {
    startPrime: globalCursor,
    skippedCount: 0, // Everyone joins the "Live" stream directly
    offlineTimeMs: 0
  };
};