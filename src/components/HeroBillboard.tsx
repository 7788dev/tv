'use client';

import { motion } from 'framer-motion';
import { Info, Play, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { processImageUrl } from '@/lib/utils';

interface HeroBillboardProps {
  title: string;
  description?: string;
  poster: string;
  backdrop?: string;
  year?: string;
  rate?: string;
  douban_id?: string;
  onPlayClick?: () => void;
  onInfoClick?: () => void;
}

export default function HeroBillboard({
  title,
  description,
  poster,
  backdrop,
  year,
  rate,
  douban_id,
  onPlayClick,
  onInfoClick,
}: HeroBillboardProps) {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const imageUrl = processImageUrl(backdrop || poster);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handlePlay = () => {
    if (onPlayClick) {
      onPlayClick();
    } else {
      router.push(
        `/play?title=${encodeURIComponent(title.trim())}${
          year ? `&year=${year}` : ''
        }`
      );
    }
  };

  const handleInfo = () => {
    if (onInfoClick) {
      onInfoClick();
    } else if (douban_id) {
      window.open(`https://movie.douban.com/subject/${douban_id}`, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0 }}
      transition={{ duration: 0.8 }}
      className='relative w-full h-[50vh] sm:h-[70vh] lg:h-[80vh] overflow-hidden'
    >
      {/* Background Image */}
      <div className='absolute inset-0'>
        <Image
          src={imageUrl}
          alt={title}
          fill
          className='object-cover'
          priority
          referrerPolicy='no-referrer'
          onLoad={() => setIsLoaded(true)}
        />
        {/* Gradient Overlays */}
        <div className='absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-gray-900' />
        <div className='absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent dark:from-gray-900/80 dark:via-gray-900/40' />
        <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-gray-900' />
      </div>

      {/* Content */}
      <div className='relative h-full flex items-center px-4 sm:px-10 lg:px-16'>
        <div className='max-w-2xl space-y-4 sm:space-y-6'>
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className='text-3xl sm:text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white drop-shadow-2xl'
          >
            {title}
          </motion.h1>

          {/* Meta Information */}
          {(year || rate) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className='flex items-center gap-3 text-sm sm:text-base'
            >
              {rate && (
                <span className='flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold'>
                  <span className='text-yellow-500'>★</span>
                  {rate}
                </span>
              )}
              {year && (
                <span className='text-gray-700 dark:text-gray-300 font-medium'>
                  {year}
                </span>
              )}
            </motion.div>
          )}

          {/* Description */}
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className='text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 line-clamp-3 sm:line-clamp-4 max-w-xl drop-shadow-lg'
            >
              {description}
            </motion.p>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className='flex items-center gap-3 sm:gap-4'
          >
            <button
              onClick={handlePlay}
              className='flex items-center gap-2 px-4 sm:px-8 py-2 sm:py-3 bg-white hover:bg-white/90 text-gray-900 rounded-md font-semibold transition-all duration-200 hover:scale-105 shadow-lg'
            >
              <Play className='w-5 h-5 sm:w-6 sm:h-6' fill='currentColor' />
              <span className='text-sm sm:text-base lg:text-lg'>播放</span>
            </button>
            <button
              onClick={handleInfo}
              className='flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-500/70 hover:bg-gray-500/50 text-white rounded-md font-semibold transition-all duration-200 hover:scale-105 backdrop-blur-sm shadow-lg'
            >
              <Info className='w-5 h-5 sm:w-6 sm:h-6' />
              <span className='text-sm sm:text-base lg:text-lg'>更多信息</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Mute Button (Optional) */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        onClick={() => setIsMuted(!isMuted)}
        className='hidden sm:flex absolute bottom-8 right-8 sm:bottom-12 sm:right-12 items-center justify-center w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/70 hover:border-white rounded-full bg-transparent hover:bg-white/10 transition-all duration-200'
      >
        {isMuted ? (
          <VolumeX className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
        ) : (
          <Volume2 className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
        )}
      </motion.button>

      {/* Age Rating Badge (Optional) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className='hidden sm:block absolute bottom-8 left-8 sm:bottom-12 sm:left-12 px-2 py-1 border-2 border-gray-400 text-gray-400 text-xs font-bold'
      >
        13+
      </motion.div>
    </motion.div>
  );
}
