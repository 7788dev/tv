import { motion } from 'framer-motion';

interface ShimmerCardProps {
  className?: string;
}

export default function ShimmerCard({ className = '' }: ShimmerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`shimmer rounded-lg bg-gray-200 dark:bg-gray-800 ${className}`}
    />
  );
}
