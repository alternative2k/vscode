import type { PerformanceMetrics } from '../utils/performanceMonitor';

interface PerformanceDisplayProps {
  metrics: PerformanceMetrics | null;
}

export function PerformanceDisplay({ metrics }: PerformanceDisplayProps) {
  if (!metrics || !import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-2 right-2 bg-gray-900/90 text-xs text-green-400 p-3 rounded-lg shadow-lg font-mono pointer-events-none opacity-80">
      <div className="font-bold mb-1">Pose Detection Performance</div>
      <div>FPS: {metrics.fps}</div>
      <div>Frame Time: {metrics.frameTime}ms</div>
      <div>Dropped Frames: {metrics.droppedFrames}/{metrics.totalFrames}</div>
      <div>Blocked: {metrics.mainThreadBlocked}ms</div>
      {metrics.memoryUsage && (
        <div>Memory: {metrics.memoryUsage.toFixed(1)}MB ({metrics.memoryTrend})</div>
      )}
      <div>Cores: {metrics.hardwareConcurrency}</div>
      {metrics.deviceMemory && <div>Device Memory: {metrics.deviceMemory}GB</div>}
    </div>
  );
}