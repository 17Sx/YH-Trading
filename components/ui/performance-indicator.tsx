"use client";

import { memo, useEffect, useState } from 'react';
import { Zap, TrendingUp, Clock, Database } from 'lucide-react';

interface PerformanceMetrics {
  renderTime: number;
  tradesCount: number;
  memoryUsage?: number;
  isVirtualized: boolean;
}

interface PerformanceIndicatorProps {
  metrics: PerformanceMetrics;
  className?: string;
}

export const PerformanceIndicator = memo(({ metrics, className = "" }: PerformanceIndicatorProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [metrics]);

  if (!isVisible) return null;

  const getPerformanceColor = (renderTime: number) => {
    if (renderTime < 16) return 'text-green-400';
    if (renderTime < 33) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPerformanceText = (renderTime: number) => {
    if (renderTime < 16) return 'Excellent';
    if (renderTime < 33) return 'Bon';
    return 'À optimiser';
  };

  return (
    <div className={`fixed bottom-4 right-4 bg-gray-800/90 backdrop-blur-md border border-gray-700/50 rounded-lg p-4 shadow-xl transition-all duration-300 z-50 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-gray-200">Performance</span>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-gray-300">Render:</span>
          </div>
          <span className={`font-mono ${getPerformanceColor(metrics.renderTime)}`}>
            {metrics.renderTime.toFixed(1)}ms ({getPerformanceText(metrics.renderTime)})
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3 text-gray-400" />
            <span className="text-gray-300">Trades:</span>
          </div>
          <span className="font-mono text-blue-400">
            {metrics.tradesCount.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-gray-400" />
            <span className="text-gray-300">Mode:</span>
          </div>
          <span className={`font-mono ${metrics.isVirtualized ? 'text-green-400' : 'text-orange-400'}`}>
            {metrics.isVirtualized ? 'Virtualisé' : 'Standard'}
          </span>
        </div>
        
        {metrics.memoryUsage && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-300">Mémoire:</span>
            <span className="font-mono text-purple-400">
              {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
            </span>
          </div>
        )}
      </div>
      
      {metrics.isVirtualized && (
        <div className="mt-2 pt-2 border-t border-gray-700/50">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400">Optimisations actives</span>
          </div>
        </div>
      )}
    </div>
  );
});

PerformanceIndicator.displayName = 'PerformanceIndicator';

export function useRenderPerformance(tradesCount: number, isVirtualized: boolean = false) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    tradesCount,
    isVirtualized
  });

  useEffect(() => {
    const startTime = performance.now();
    
    const measureRender = () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics({
        renderTime,
        tradesCount,
        isVirtualized,
        memoryUsage: (performance as any).memory?.usedJSHeapSize
      });
    };

    const rafId = requestAnimationFrame(measureRender);
    
    return () => cancelAnimationFrame(rafId);
  }, [tradesCount, isVirtualized]);

  return metrics;
} 