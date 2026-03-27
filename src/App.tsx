/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Upload, Droplets, Wind, Eye, X, CloudRain, Snowflake } from 'lucide-react';
import AtmosphericCanvas from './AtmosphericCanvas';
import { TypingDate } from './components/TypingDate';
import { GlassEditor } from './components/GlassEditor';

const DEFAULT_RAIN_BG = 'https://i.postimg.cc/xCgXtPdN/photo-1762284128684-b2fd9680216d.avif';
const DEFAULT_SNOW_BG = 'https://i.postimg.cc/C1M1Bfsr/photo-1491002052546-bf38f186af56.avif';

export default function App() {
  const [mode, setMode] = useState<'rain' | 'snow'>('rain');
  const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_RAIN_BG);
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>('image');
  const [rainAmount, setRainAmount] = useState(0.5);
  const [fogAmount, setFogAmount] = useState(0.2);
  const [refraction, setRefraction] = useState(0.1);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video') ? 'video' : 'image';
      setBackgroundUrl(url);
      setBackgroundType(type);
    }
  };

  const toggleMode = (newMode: 'rain' | 'snow') => {
    if (newMode === mode) return;
    setMode(newMode);
    // If user hasn't uploaded a custom background, switch to default for that mode
    if (backgroundUrl === DEFAULT_RAIN_BG || backgroundUrl === DEFAULT_SNOW_BG) {
      setBackgroundUrl(newMode === 'rain' ? DEFAULT_RAIN_BG : DEFAULT_SNOW_BG);
      setBackgroundType('image');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 20, ease: "easeInOut" }}
      className="relative min-h-screen w-full overflow-hidden font-sans text-white selection:bg-white/20"
    >
      {/* GLSL Atmospheric Canvas */}
      <AtmosphericCanvas
        mode={mode}
        backgroundUrl={backgroundUrl}
        backgroundType={backgroundType}
        rainAmount={rainAmount}
        fogAmount={fogAmount}
        refraction={refraction}
      />

      {/* Typing Date Animation */}
      <TypingDate />

      {/* Immersive Glass Editor */}
      <GlassEditor mode={mode} />

      {/* Floating Controls Trigger */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsControlsOpen(!isControlsOpen)}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl hover:bg-white/10 transition-colors"
      >
        {isControlsOpen ? <X size={24} strokeWidth={1.5} /> : <Settings size={24} strokeWidth={1.5} />}
      </motion.button>

      {/* Controls Panel */}
      <AnimatePresence>
        {isControlsOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-28 right-8 z-50 w-80 p-6 rounded-3xl backdrop-blur-3xl bg-black/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
          >
            <div className="space-y-8">
              {/* Mode Switcher */}
              <div className="flex p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  onClick={() => toggleMode('rain')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${mode === 'rain' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                >
                  <CloudRain size={14} />
                  <span className="text-[10px] uppercase tracking-widest font-medium">Rain</span>
                </button>
                <button
                  onClick={() => toggleMode('snow')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${mode === 'snow' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Snowflake size={14} />
                  <span className="text-[10px] uppercase tracking-widest font-medium">Snow</span>
                </button>
              </div>

              {/* Control Group: Intensity */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 opacity-60">
                    <Droplets size={16} strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-widest font-medium">Intensity</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-40">{Math.round(rainAmount * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={rainAmount}
                  onChange={(e) => setRainAmount(parseFloat(e.target.value))}
                  className="w-full h-0.5 bg-white/10 appearance-none rounded-full accent-white cursor-pointer"
                />
              </div>

              {/* Control Group: Fog */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 opacity-60">
                    <Wind size={16} strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-widest font-medium">Fog</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-40">{Math.round(fogAmount * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={fogAmount}
                  onChange={(e) => setFogAmount(parseFloat(e.target.value))}
                  className="w-full h-0.5 bg-white/10 appearance-none rounded-full accent-white cursor-pointer"
                />
              </div>

              {/* Control Group: Refraction (Rain only) */}
              {mode === 'rain' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 opacity-60">
                      <Eye size={16} strokeWidth={1.5} />
                      <span className="text-[10px] uppercase tracking-widest font-medium">Refraction</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-40">{refraction.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={refraction}
                    onChange={(e) => setRefraction(parseFloat(e.target.value))}
                    className="w-full h-0.5 bg-white/10 appearance-none rounded-full accent-white cursor-pointer"
                  />
                </div>
              )}

              {/* Background Upload */}
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 hover:bg-white/10 transition-all group"
                >
                  <Upload size={16} strokeWidth={1.5} className="group-hover:-translate-y-0.5 transition-transform" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Upload Media</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liquid Glass Overlay (Subtle) */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/40 z-0" />
    </motion.div>
  );
}
