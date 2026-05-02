type Listener = (event: unknown) => void;

const subscribers = new Map<string, Set<Listener>>();

export const eventBus = {
  subscribe(jobId: string, listener: Listener): () => void {
    if (!subscribers.has(jobId)) subscribers.set(jobId, new Set());
    subscribers.get(jobId)!.add(listener);
    return () => {
      subscribers.get(jobId)?.delete(listener);
      if (subscribers.get(jobId)?.size === 0) subscribers.delete(jobId);
    };
  },

  publish(jobId: string, event: unknown): void {
    subscribers.get(jobId)?.forEach((fn) => {
      try {
        fn(event);
      } catch {
        // listener errors must not crash the bus
      }
    });
  },

  listenerCount(jobId: string): number {
    return subscribers.get(jobId)?.size ?? 0;
  },
};
