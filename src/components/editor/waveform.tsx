'use client';
// Mini audio waveform visualization for timeline clips
import { useEffect, useRef, useState } from "react";

interface WaveformProps {
  url: string;
  color?: string;
  height?: number;
  /** Approximate number of bars; bar width auto-fits */
  bars?: number;
  className?: string;
}

interface PeakData {
  peaks: number[];
  duration: number;
}

const cache = new Map<string, PeakData>();

export default function Waveform({ url, color = "#10b981", height = 36, bars = 80, className }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const draw = (peaks: number[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      const barWidth = w / bars;
      const mid = h / 2;
      for (let i = 0; i < peaks.length; i++) {
        const amp = Math.max(0.02, peaks[i]);
        const barH = amp * h * 0.95;
        const x = i * barWidth;
        const y = mid - barH / 2;
        ctx.fillRect(x, y, Math.max(0.5, barWidth - 1), barH);
      }
    };

    const compute = async () => {
      if (cache.has(url)) {
        const data = cache.get(url)!;
        setStatus("ready");
        // Wait a tick for canvas to size
        requestAnimationFrame(() => draw(data.peaks));
        return;
      }
      try {
        setStatus("loading");
        const res = await fetch(url);
        const ab = await res.arrayBuffer();
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) throw new Error("no audio context");
        const ac = new Ctx();
        const buf = await ac.decodeAudioData(ab);
        ac.close();
        const ch = buf.getChannelData(0);
        const samplesPerBar = Math.floor(ch.length / bars);
        const peaks: number[] = [];
        for (let i = 0; i < bars; i++) {
          let max = 0;
          const start = i * samplesPerBar;
          const end = Math.min(start + samplesPerBar, ch.length);
          for (let j = start; j < end; j++) {
            const v = Math.abs(ch[j]);
            if (v > max) max = v;
          }
          peaks.push(max);
        }
        // normalize
        const peak = Math.max(...peaks, 0.001);
        const norm = peaks.map((p) => p / peak);
        cache.set(url, { peaks: norm, duration: buf.duration });
        if (cancelled) return;
        setStatus("ready");
        requestAnimationFrame(() => draw(norm));
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
      }
    };
    compute();
    const onResize = () => {
      if (cache.has(url)) {
        const data = cache.get(url)!;
        draw(data.peaks);
      }
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [url, color, height, bars]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height, display: "block" }}
      aria-hidden="true"
    />
  );
}
