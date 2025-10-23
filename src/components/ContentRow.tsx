'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import ScrollableRow from '@/components/ScrollableRow';

interface ContentRowProps {
  title: string;
  href?: string;
  children: React.ReactNode;
  onClearClick?: () => void;
  showClear?: boolean;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

export default function ContentRow({
  title,
  href,
  children,
  onClearClick,
  showClear = false,
  className,
}: ContentRowProps) {
  return (
    <motion.section
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true, margin: '-100px' }}
      variants={containerVariants}
      className={`mb-8 ${className || ''}`}
    >
      <motion.div
        variants={itemVariants}
        className='mb-4 flex items-center justify-between px-2'
      >
        <h2 className='text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 transition-colors duration-300 flex items-center gap-2'>
          <span className='inline-block w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full'></span>
          {title}
        </h2>
        <div className='flex items-center gap-4'>
          {showClear && onClearClick && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className='text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors duration-200 font-medium'
              onClick={onClearClick}
            >
              清空
            </motion.button>
          )}
          {href && (
            <Link
              href={href}
              className='flex items-center text-sm text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors duration-200 group font-medium'
            >
              <span>查看更多</span>
              <motion.div
                initial={{ x: 0 }}
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <ChevronRight className='w-4 h-4 ml-1' />
              </motion.div>
            </Link>
          )}
        </div>
      </motion.div>
      <motion.div variants={itemVariants}>
        <ScrollableRow>{children}</ScrollableRow>
      </motion.div>
    </motion.section>
  );
}
