export const isPrime = (n: bigint): boolean => {
  if (n <= 1n) return false;
  if (n <= 3n) return true;
  if (n % 2n === 0n || n % 3n === 0n) return false;

  for (let i = 5n; i * i <= n; i += 6n) {
    if (n % i === 0n || n % (i + 2n) === 0n) return false;
  }
  return true;
};

export const findPreviousPrimes = (start: bigint, count: number): bigint[] => {
  const primes: bigint[] = [];
  let current = start - 1n;
  
  while (primes.length < count && current >= 2n) {
    if (isPrime(current)) {
      primes.unshift(current);
    }
    current--;
  }
  return primes;
};