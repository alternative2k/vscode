export interface PerformanceMetrics {
  // Frame processing metrics
  frameTime: number;
  fps: number;
  droppedFrames: number;
  totalFrames: number;

  // CPU metrics
  mainThreadBlocked: number;
  longestBlockingTime: number;

  // Memory metrics
  memoryUsage: number | null;
  memoryTrend: 'stable' | 'increasing' | 'decreasing';

  // Device metrics
  hardwareConcurrency: number;
  deviceMemory: number | null;
}

export interface WorkerRecommendation {
  shouldUseWorker: boolean;
  reason: string;
  metrics: PerformanceMetrics;
}

export function getHardwareInfo(): { cores: number; memory: number | null } {
  return {
    cores: navigator.hardwareConcurrency || 4,
    memory: (navigator as { deviceMemory?: number }).deviceMemory ?? null,
  };
}

export function getMemoryUsage(): number | null {
  if ('memory' in performance) {
    const mem = (performance as any).memory;
    return mem.usedJSHeapSize / (1024 * 1024);
  }
  return null;
}

export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private droppedFrames = 0;
  private totalFrames = 0;
  private blockedTimes: number[] = [];
  private longestBlockingTime = 0;
  private memorySnapshots: number[] = [];

  private readonly MAX_SAMPLES = 60;

  recordFrameTime(time: number): void {
    this.frameTimes.push(time);
    if (this.frameTimes.length > this.MAX_SAMPLES) {
      this.frameTimes.shift();
    }

    if (time > 100) {
      this.droppedFrames++;
    }
    this.totalFrames++;
  }

  recordBlockingTime(time: number): void {
    this.blockedTimes.push(time);
    if (time > this.longestBlockingTime) {
      this.longestBlockingTime = time;
    }
  }

  recordMemory(): void {
    const mem = getMemoryUsage();
    if (mem !== null) {
      this.memorySnapshots.push(mem);
      if (this.memorySnapshots.length > this.MAX_SAMPLES) {
        this.memorySnapshots.shift();
      }
    }
  }

  getMetrics(): PerformanceMetrics {
    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 0;

    const fps = avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 0;

    const avgBlockingTime = this.blockedTimes.length > 0
      ? this.blockedTimes.reduce((a, b) => a + b, 0) / this.blockedTimes.length
      : 0;

    const memoryUsage = this.memorySnapshots.length > 0
      ? this.memorySnapshots[this.memorySnapshots.length - 1]
      : null;

    const memoryTrend = this.calculateTrend();

    const hardware = getHardwareInfo();

    return {
      frameTime: Math.round(avgFrameTime),
      fps,
      droppedFrames: this.droppedFrames,
      totalFrames: this.totalFrames,
      mainThreadBlocked: Math.round(avgBlockingTime),
      longestBlockingTime: Math.round(this.longestBlockingTime),
      memoryUsage,
      memoryTrend,
      hardwareConcurrency: hardware.cores,
      deviceMemory: hardware.memory,
    };
  }

  private calculateTrend(): 'stable' | 'increasing' | 'decreasing' {
    if (this.memorySnapshots.length < 10) {
      return 'stable';
    }

    const recent = this.memorySnapshots.slice(-5);
    const older = this.memorySnapshots.slice(-10, -5);

    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;

    const diff = avgRecent - avgOlder;

    if (diff > 5) return 'increasing';
    if (diff < -5) return 'decreasing';
    return 'stable';
  }

  reset(): void {
    this.frameTimes = [];
    this.droppedFrames = 0;
    this.totalFrames = 0;
    this.blockedTimes = [];
    this.longestBlockingTime = 0;
    this.memorySnapshots = [];
  }
}

export function evaluateWorkerNeed(metrics: PerformanceMetrics): WorkerRecommendation {
  const reasons: string[] = [];

  if (metrics.mainThreadBlocked > 30) {
    reasons.push(`Main thread blocked ${metrics.mainThreadBlocked}ms per frame (threshold: 30ms)`);
  }

  const dropRate = metrics.totalFrames > 0
    ? (metrics.droppedFrames / metrics.totalFrames) * 100
    : 0;

  if (dropRate > 10) {
    reasons.push(`${dropRate.toFixed(1)}% dropped frames (threshold: 10%)`);
  }

  if (metrics.fps < 12) {
    reasons.push(`FPS at ${metrics.fps} (target: 15)`);
  }

  if (metrics.memoryTrend === 'increasing' && metrics.memoryUsage && metrics.memoryUsage > 100) {
    reasons.push(`Memory usage increasing (${metrics.memoryUsage.toFixed(1)}MB)`);
  }

  if (metrics.longestBlockingTime > 100) {
    reasons.push(`Peak blocking time ${metrics.longestBlockingTime}ms (threshold: 100ms)`);
  }

  const shouldUseWorker = reasons.length > 0;

  return {
    shouldUseWorker,
    reason: shouldUseWorker
      ? `Workers recommended: ${reasons.join('; ')}`
      : 'Workers not needed: Performance is acceptable',
    metrics,
  };
}