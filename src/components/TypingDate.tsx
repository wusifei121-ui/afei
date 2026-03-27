import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export const TypingDate: React.FC = () => {
  const [text, setText] = useState('');
  const fullText = '今日 · ' + new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(timer);
    }, 150);
    return () => clearInterval(timer);
  }, [fullText]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, duration: 1.5 }}
      className="fixed top-12 left-12 z-40 font-mono text-[26.6px] tracking-[0.2em] text-white"
    >
      {text}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 1, ease: "steps(2)" }}
        className="inline-block w-[2px] h-6 ml-2 bg-white align-middle"
      />
    </motion.div>
  );
};
