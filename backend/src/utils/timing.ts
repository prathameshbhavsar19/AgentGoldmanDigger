export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function backoff(attempt: number, base = 1000, cap = 30_000): number {
  return Math.min(cap, base * Math.pow(2, attempt));
}
