'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Info, Play } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { processImageUrl } from '@/lib/utils';

interface HeroItem {
  id: string;
  title: string;
  poster: string;
  rate?: string;
  year?: string;
}

interface HeroCarouselProps {
  items: HeroItem[];
  autoPlayInterval?: number;
}

export default function HeroCarousel({
  items,
  autoPlayInterval = 6000,
}: HeroCarouselProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentItem = items[currentIndex];
  const imageUrl = processImageUrl(currentItem?.poster);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!items.length || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [items.length, autoPlayInterval, isPaused]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePlay = () => {
    if (currentItem) {
      router.push(
        `/play?title=${encodeURIComponent(currentItem.title.trim())}${
          currentItem.year ? `&year=${currentItem.year}` : ''
        }`
      );
    }
  };

  const handleInfo = () => {
    if (currentItem?.id) {
      window.open(
        `https://movie.douban.com/subject/${currentItem.id}`,
        '_blank'
      );
    }
  };

  if (!items.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0 }}
      transition={{ duration: 0.8 }}
      className='relative w-full h-[50vh] sm:h-[70vh] lg:h-[80vh] overflow-hidden rounded-2xl mb-8 shadow-2xl group'
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className='absolute inset-0'
        >
          {/* Background Image */}
          <div className='absolute inset-0'>
            <Image
              src={imageUrl}
              alt={currentItem.title}
              fill
              className='object-cover'
              priority={currentIndex === 0}
              quality={95}
              sizes='100vw'
              referrerPolicy='no-referrer'
              onLoad={() => setIsLoaded(true)}
            />
            {/* Enhanced Gradient Overlays */}
            <div className='absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-gray-900' />
            <div className='absolute inset-0 bg-gradient-to-r from-white/95 via-white/60 to-transparent dark:from-gray-900/95 dark:via-gray-900/60' />
            <div className='absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-white dark:to-gray-900' />
          </div>

          {/* Content */}
          <div className='relative h-full flex items-center px-4 sm:px-10 lg:px-16'>
            <div className='max-w-2xl space-y-4 sm:space-y-6'>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className='inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500/90 to-red-600/90 text-white rounded-full text-sm font-bold shadow-lg backdrop-blur-sm'
              >
                <span className='relative flex h-2 w-2'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-2 w-2 bg-white'></span>
                </span>
                热门推荐
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className='text-3xl sm:text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white drop-shadow-2xl leading-tight'
              >
                {currentItem.title}
              </motion.h1>

              {/* Meta Information */}
              {(currentItem.year || currentItem.rate) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className='flex items-center gap-4 text-sm sm:text-base'
                >
                  {currentItem.rate && (
                    <span className='flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 dark:bg-yellow-500/30 rounded-lg backdrop-blur-sm'>
                      <span className='text-yellow-500 text-lg'>★</span>
                      <span className='text-gray-900 dark:text-white font-bold'>
                        {currentItem.rate}
                      </span>
                      <span className='text-gray-600 dark:text-gray-400 text-xs'>
                        豆瓣评分
                      </span>
                    </span>
                  )}
                  {currentItem.year && (
                    <span className='px-3 py-1.5 bg-gray-900/20 dark:bg-white/20 text-gray-900 dark:text-white rounded-lg font-semibold backdrop-blur-sm'>
                      {currentItem.year}
                    </span>
                  )}
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className='flex items-center gap-3 sm:gap-4'
              >
                <motion.button
                  onClick={handlePlay}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold transition-all duration-200 shadow-xl hover:shadow-2xl text-sm sm:text-base lg:text-lg'
                >
                  <Play className='w-5 h-5 sm:w-6 sm:h-6' fill='currentColor' />
                  <span>立即播放</span>
                </motion.button>
                <motion.button
                  onClick={handleInfo}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='flex items-center gap-2 px-5 sm:px-7 py-3 sm:py-4 bg-white/30 hover:bg-white/40 dark:bg-gray-900/50 dark:hover:bg-gray-900/60 text-gray-900 dark:text-white rounded-xl font-bold transition-all duration-200 backdrop-blur-md shadow-lg hover:shadow-xl border-2 border-white/40 dark:border-white/20 text-sm sm:text-base lg:text-lg'
                >
                  <Info className='w-5 h-5 sm:w-6 sm:h-6' />
                  <span>更多信息</span>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={handlePrevious}
            className='absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 dark:bg-gray-900/40 dark:hover:bg-gray-900/60 backdrop-blur-md flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 border border-white/30 dark:border-white/20'
          >
            <ChevronLeft className='w-6 h-6 text-white' />
          </motion.button>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={handleNext}
            className='absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 dark:bg-gray-900/40 dark:hover:bg-gray-900/60 backdrop-blur-md flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 border border-white/30 dark:border-white/20'
          >
            <ChevronRight className='w-6 h-6 text-white' />
          </motion.button>
        </>
      )}

      {/* Pagination Dots */}
      {items.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className='absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2'
        >
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className='group relative'
            >
              <div
                className={`h-1.5 transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-1.5 bg-white/50 group-hover:bg-white/70'
                }`}
              />
              {index === currentIndex && (
                <motion.div
                  layoutId='activeIndicator'
                  className='absolute inset-0 rounded-full bg-white shadow-lg'
                />
              )}
            </button>
          ))}
        </motion.div>
      )}

      {/* Current Item Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='absolute top-6 right-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-white text-sm font-medium'
      >
        {currentIndex + 1} / {items.length}
      </motion.div>
    </motion.div>
  );
}
