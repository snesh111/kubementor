import React, { useState, useEffect } from 'react';

const ROTATING_WORDS = [
  {
    fullText: 'Kubernetes',
    render: (currentLength) => {
      const text = 'Kubernetes'.slice(0, currentLength);
      // 'Kube' in emerald, 'rnetes' in cyan
      const part1 = text.slice(0, 4);
      const part2 = text.slice(4);
      return (
        <span className="inline-block transition-all">
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]">
            {part1}
          </span>
          <span className="bg-gradient-to-r from-teal-300 via-cyan-400 to-sky-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(56,189,248,0.4)]">
            {part2}
          </span>
        </span>
      );
    },
  },
  {
    fullText: 'DevOps',
    render: (currentLength) => {
      const text = 'DevOps'.slice(0, currentLength);
      // 'Dev' in vibrant orange, 'Ops' in bright emerald (matching escbash style)
      const part1 = text.slice(0, 3);
      const part2 = text.slice(3);
      return (
        <span className="inline-block transition-all">
          <span className="text-[#fb923c] drop-shadow-[0_0_20px_rgba(251,146,60,0.5)] font-black">
            {part1}
          </span>
          <span className="text-[#34d399] drop-shadow-[0_0_20px_rgba(52,211,153,0.5)] font-black">
            {part2}
          </span>
        </span>
      );
    },
  },
];

export const TypewriterWordRotator = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [charLength, setCharLength] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentWord = ROTATING_WORDS[wordIndex].fullText;

    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 1800); // Display full word for 1.8s
      return () => clearTimeout(pauseTimer);
    }

    if (!isDeleting) {
      // TYPING STATE (Letter by Letter)
      if (charLength < currentWord.length) {
        const typeTimer = setTimeout(() => {
          setCharLength((prev) => prev + 1);
        }, 90);
        return () => clearTimeout(typeTimer);
      } else {
        // Finished typing word, enter pause
        setIsPaused(true);
      }
    } else {
      // CUTTING / DELETING STATE (Cut word by word/letter by letter)
      if (charLength > 0) {
        const deleteTimer = setTimeout(() => {
          setCharLength((prev) => prev - 1);
        }, 45);
        return () => clearTimeout(deleteTimer);
      } else {
        // Word completely cut, switch to next word
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
      }
    }
  }, [charLength, isDeleting, isPaused, wordIndex]);

  const currentItem = ROTATING_WORDS[wordIndex];

  return (
    <span className="inline-flex items-center relative">
      {currentItem.render(charLength)}
      <span className="inline-block w-[3px] sm:w-[4px] h-[0.85em] bg-emerald-400 ml-1.5 align-middle rounded-full animate-pulse shadow-[0_0_12px_#34d399]" />
    </span>
  );
};

export default TypewriterWordRotator;
