import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save } from 'lucide-react';

interface GlassEditorProps {
  mode: 'rain' | 'snow';
}

export const GlassEditor: React.FC<GlassEditorProps> = ({ mode }) => {
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (!content.trim()) return;
    setIsSaving(true);
    // Simulate particle effect duration
    setTimeout(() => {
      setIsSaved(true);
      setIsSaving(false);
    }, 1500);
  };

  const particles = Array.from({ length: 200 });

  return (
    <AnimatePresence mode="wait">
      {!isSaved ? (
        <motion.div
          key="editor"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ 
            opacity: isSaving ? 0 : 1, 
            scale: isSaving ? 1.02 : 1,
            filter: isSaving ? 'blur(15px)' : 'blur(0px)',
            y: isSaving ? (mode === 'rain' ? 20 : -10) : 0
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="fixed inset-0 flex items-center justify-center p-8 z-10 pointer-events-none"
        >
          <div className="w-full max-w-3xl h-[60vh] relative pointer-events-auto">
            {/* Particle scattering effect */}
            {isSaving && particles.map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: (Math.random() - 0.5) * 40, 
                  y: (Math.random() - 0.5) * 40,
                  opacity: 1,
                  scale: Math.random() * 1.2 + 0.4,
                  rotate: mode === 'snow' ? Math.random() * 360 : 0
                }}
                animate={{ 
                  x: (Math.random() - 0.5) * 1600, 
                  y: mode === 'rain' ? 1000 : (Math.random() - 0.5) * 1000,
                  opacity: 0,
                  scale: 0,
                  rotate: mode === 'snow' ? Math.random() * 1080 : 0
                }}
                transition={{ 
                  duration: Math.random() * 1.2 + 1, 
                  ease: mode === 'rain' ? [0.11, 0, 0.5, 0] : [0.23, 1, 0.32, 1],
                  delay: Math.random() * 0.4
                }}
                className={`absolute bg-white/60 backdrop-blur-sm ${mode === 'rain' ? 'w-[1px] h-6 rounded-full' : 'w-2 h-2'}`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  clipPath: mode === 'snow' 
                    ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' 
                    : 'none'
                }}
              />
            ))}

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSaving}
              placeholder="开始记录这一刻..."
              className="w-full h-full p-16 rounded-[20px] backdrop-blur-[20px] bg-white/10 border border-white/[0.08] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.4)] text-white placeholder:text-white/20 text-2xl leading-[1.8] focus:outline-none focus:bg-white/[0.03] transition-all resize-none font-serif tracking-wide"
            />
            
            {/* Save Button */}
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
              className={`absolute bottom-8 right-8 flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-xl border border-white/10 transition-all ${
                isSaving ? 'opacity-0 pointer-events-none' : 'opacity-100'
              } ${!content.trim() ? 'opacity-20 cursor-not-allowed' : 'bg-white/5'}`}
            >
              <Save size={18} strokeWidth={1.5} className="text-white/60" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-white/60 font-medium">Save</span>
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="new-note"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed inset-0 flex items-center justify-center z-10"
        >
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setContent('');
              setIsSaved(false);
            }}
            className="px-12 py-4 rounded-full backdrop-blur-3xl bg-white/5 border border-white/10 text-[12px] uppercase tracking-[0.5em] text-white/40 hover:text-white/80 transition-all"
          >
            New Note
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
