/* eslint-disable @typescript-eslint/no-explicit-any */

import { motion } from 'framer-motion';
import { CheckCircle, Heart, Link, PlayCircleIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  deleteFavorite,
  deletePlayRecord,
  generateStorageKey,
  isFavorited,
  saveFavorite,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { SearchResult } from '@/lib/types';
import { processImageUrl } from '@/lib/utils';

import { ImagePlaceholder } from '@/components/ImagePlaceholder';

interface VideoCardProps {
  id?: string;
  source?: string;
  title?: string;
  query?: string;
  poster?: string;
  episodes?: number;
  source_name?: string;
  progress?: number;
  year?: string;
  from: 'playrecord' | 'favorite' | 'search' | 'douban';
  currentEpisode?: number;
  douban_id?: string;
  onDelete?: () => void;
  rate?: string;
  items?: SearchResult[];
  type?: string;
}

export default function VideoCard({
  id,
  title = '',
  query = '',
  poster = '',
  episodes,
  source,
  source_name,
  progress = 0,
  year,
  from,
  currentEpisode,
  douban_id,
  onDelete,
  rate,
  items,
  type = '',
}: VideoCardProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isAggregate = from === 'search' && !!items?.length;

  const aggregateData = useMemo(() => {
    if (!isAggregate || !items) return null;
    const countMap = new Map<string | number, number>();
    const episodeCountMap = new Map<number, number>();
    items.forEach((item) => {
      if (item.douban_id && item.douban_id !== 0) {
        countMap.set(item.douban_id, (countMap.get(item.douban_id) || 0) + 1);
      }
      const len = item.episodes?.length || 0;
      if (len > 0) {
        episodeCountMap.set(len, (episodeCountMap.get(len) || 0) + 1);
      }
    });

    const getMostFrequent = <T extends string | number>(
      map: Map<T, number>
    ) => {
      let maxCount = 0;
      let result: T | undefined;
      map.forEach((cnt, key) => {
        if (cnt > maxCount) {
          maxCount = cnt;
          result = key;
        }
      });
      return result;
    };

    return {
      first: items[0],
      mostFrequentDoubanId: getMostFrequent(countMap),
      mostFrequentEpisodes: getMostFrequent(episodeCountMap) || 0,
    };
  }, [isAggregate, items]);

  const actualTitle = aggregateData?.first.title ?? title;
  const actualPoster = aggregateData?.first.poster ?? poster;
  const actualSource = aggregateData?.first.source ?? source;
  const actualId = aggregateData?.first.id ?? id;
  const actualDoubanId = String(
    aggregateData?.mostFrequentDoubanId ?? douban_id
  );
  const actualEpisodes = aggregateData?.mostFrequentEpisodes ?? episodes;
  const actualYear = aggregateData?.first.year ?? year;
  const actualQuery = query || '';
  const actualSearchType = isAggregate
    ? aggregateData?.first.episodes?.length === 1
      ? 'movie'
      : 'tv'
    : type;

  // 获取收藏状态
  useEffect(() => {
    if (from === 'douban' || !actualSource || !actualId) return;

    const fetchFavoriteStatus = async () => {
      try {
        const fav = await isFavorited(actualSource, actualId);
        setFavorited(fav);
      } catch (err) {
        throw new Error('检查收藏状态失败');
      }
    };

    fetchFavoriteStatus();

    // 监听收藏状态更新事件
    const storageKey = generateStorageKey(actualSource, actualId);
    const unsubscribe = subscribeToDataUpdates(
      'favoritesUpdated',
      (newFavorites: Record<string, any>) => {
        // 检查当前项目是否在新的收藏列表中
        const isNowFavorited = !!newFavorites[storageKey];
        setFavorited(isNowFavorited);
      }
    );

    return unsubscribe;
  }, [from, actualSource, actualId]);

  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (from === 'douban' || !actualSource || !actualId) return;
      try {
        if (favorited) {
          // 如果已收藏，删除收藏
          await deleteFavorite(actualSource, actualId);
          setFavorited(false);
        } else {
          // 如果未收藏，添加收藏
          await saveFavorite(actualSource, actualId, {
            title: actualTitle,
            source_name: source_name || '',
            year: actualYear || '',
            cover: actualPoster,
            total_episodes: actualEpisodes ?? 1,
            save_time: Date.now(),
          });
          setFavorited(true);
        }
      } catch (err) {
        throw new Error('切换收藏状态失败');
      }
    },
    [
      from,
      actualSource,
      actualId,
      actualTitle,
      source_name,
      actualYear,
      actualPoster,
      actualEpisodes,
      favorited,
    ]
  );

  const handleDeleteRecord = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (from !== 'playrecord' || !actualSource || !actualId) return;
      try {
        await deletePlayRecord(actualSource, actualId);
        onDelete?.();
      } catch (err) {
        throw new Error('删除播放记录失败');
      }
    },
    [from, actualSource, actualId, onDelete]
  );

  const handleClick = useCallback(() => {
    if (from === 'douban') {
      router.push(
        `/play?title=${encodeURIComponent(actualTitle.trim())}${
          actualYear ? `&year=${actualYear}` : ''
        }${actualSearchType ? `&stype=${actualSearchType}` : ''}`
      );
    } else if (actualSource && actualId) {
      router.push(
        `/play?source=${actualSource}&id=${actualId}&title=${encodeURIComponent(
          actualTitle
        )}${actualYear ? `&year=${actualYear}` : ''}${
          isAggregate ? '&prefer=true' : ''
        }${
          actualQuery ? `&stitle=${encodeURIComponent(actualQuery.trim())}` : ''
        }${actualSearchType ? `&stype=${actualSearchType}` : ''}`
      );
    }
  }, [
    from,
    actualSource,
    actualId,
    router,
    actualTitle,
    actualYear,
    isAggregate,
    actualQuery,
    actualSearchType,
  ]);

  const config = useMemo(() => {
    const configs = {
      playrecord: {
        showSourceName: true,
        showProgress: true,
        showPlayButton: true,
        showHeart: true,
        showCheckCircle: true,
        showDoubanLink: false,
        showRating: false,
      },
      favorite: {
        showSourceName: true,
        showProgress: false,
        showPlayButton: true,
        showHeart: true,
        showCheckCircle: false,
        showDoubanLink: false,
        showRating: false,
      },
      search: {
        showSourceName: true,
        showProgress: false,
        showPlayButton: true,
        showHeart: !isAggregate,
        showCheckCircle: false,
        showDoubanLink: !!actualDoubanId,
        showRating: false,
      },
      douban: {
        showSourceName: false,
        showProgress: false,
        showPlayButton: true,
        showHeart: false,
        showCheckCircle: false,
        showDoubanLink: true,
        showRating: !!rate,
      },
    };
    return configs[from] || configs.search;
  }, [from, isAggregate, actualDoubanId, rate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05, zIndex: 500 }}
      className='group relative w-full rounded-lg bg-transparent cursor-pointer transition-all duration-300 ease-in-out'
      onClick={handleClick}
    >
      {/* 海报容器 */}
      <motion.div
        className='relative aspect-[2/3] overflow-hidden rounded-xl shadow-md group-hover:shadow-2xl transition-all duration-300 ring-1 ring-gray-200/50 dark:ring-gray-700/50 group-hover:ring-green-500/50'
        whileHover={{ scale: 1.02 }}
      >
        {/* 骨架屏 */}
        {!isLoading && <ImagePlaceholder aspectRatio='aspect-[2/3]' />}
        {/* 图片 */}
        <Image
          src={processImageUrl(actualPoster)}
          alt={actualTitle}
          fill
          className='object-cover'
          referrerPolicy='no-referrer'
          onLoadingComplete={() => setIsLoading(true)}
        />

        {/* 悬浮遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent'
        />

        {/* 播放按钮 */}
        {config.showPlayButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1 }}
            className='absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100'
          >
            <motion.div
              whileHover={{ scale: 1.15 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <PlayCircleIcon
                size={50}
                strokeWidth={0.8}
                className='text-white fill-transparent hover:fill-green-500 transition-all duration-300'
              />
            </motion.div>
          </motion.div>
        )}

        {/* 操作按钮 */}
        {(config.showHeart || config.showCheckCircle) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ y: 0 }}
            className='absolute bottom-3 right-3 flex gap-3 opacity-0 translate-y-2 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-y-0'
          >
            {config.showCheckCircle && (
              <motion.div
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
              >
                <CheckCircle
                  onClick={handleDeleteRecord}
                  size={20}
                  className='text-white transition-colors duration-300 hover:stroke-green-500'
                />
              </motion.div>
            )}
            {config.showHeart && (
              <motion.div
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart
                  onClick={handleToggleFavorite}
                  size={20}
                  className={`transition-all duration-300 ${
                    favorited
                      ? 'fill-red-600 stroke-red-600'
                      : 'fill-transparent stroke-white hover:stroke-red-400'
                  }`}
                />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* 徽章 */}
        {config.showRating && rate && (
          <div className='absolute top-2 right-2 bg-pink-500 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ease-out group-hover:scale-110'>
            {rate}
          </div>
        )}

        {actualEpisodes && actualEpisodes > 1 && (
          <div className='absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-md transition-all duration-300 ease-out group-hover:scale-110'>
            {currentEpisode
              ? `${currentEpisode}/${actualEpisodes}`
              : actualEpisodes}
          </div>
        )}

        {/* 豆瓣链接 */}
        {config.showDoubanLink && actualDoubanId && (
          <motion.a
            href={`https://movie.douban.com/subject/${actualDoubanId}`}
            target='_blank'
            rel='noopener noreferrer'
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ scale: 1.1 }}
            className='absolute top-2 left-2 opacity-0 -translate-x-2 transition-all duration-300 ease-in-out delay-100 group-hover:opacity-100 group-hover:translate-x-0'
          >
            <div className='bg-green-500 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:bg-green-600 transition-colors duration-300'>
              <Link size={16} />
            </div>
          </motion.a>
        )}
      </motion.div>

      {/* 进度条 */}
      {config.showProgress && progress !== undefined && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5 }}
          className='mt-1 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className='h-full bg-green-500'
          />
        </motion.div>
      )}

      {/* 标题与来源 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className='mt-2 text-center'
      >
        <div className='relative'>
          <span className='block text-sm font-semibold truncate text-gray-900 dark:text-gray-100 transition-colors duration-300 ease-in-out group-hover:text-green-600 dark:group-hover:text-green-400 peer'>
            {actualTitle}
          </span>
          {/* 自定义 tooltip */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            whileHover={{ opacity: 1, y: 0 }}
            className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all duration-200 ease-out delay-100 whitespace-nowrap pointer-events-none z-50'
          >
            {actualTitle}
            <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800'></div>
          </motion.div>
        </div>
        {config.showSourceName && source_name && (
          <span className='block text-xs text-gray-500 dark:text-gray-400 mt-1'>
            <span className='inline-block border rounded px-2 py-0.5 border-gray-500/60 dark:border-gray-400/60 transition-all duration-300 ease-in-out group-hover:border-green-500/60 group-hover:text-green-600 dark:group-hover:text-green-400'>
              {source_name}
            </span>
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
