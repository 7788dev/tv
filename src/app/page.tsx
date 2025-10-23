/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, no-console */

'use client';

import { motion } from 'framer-motion';
import { Suspense, useEffect, useState } from 'react';

// 客户端收藏 API
import {
  clearAllFavorites,
  getAllFavorites,
  getAllPlayRecords,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { getDoubanCategories } from '@/lib/douban.client';
import { DoubanItem } from '@/lib/types';

import CapsuleSwitch from '@/components/CapsuleSwitch';
import ContentRow from '@/components/ContentRow';
import ContinueWatching from '@/components/ContinueWatching';
import HeroBillboard from '@/components/HeroBillboard';
import PageLayout from '@/components/PageLayout';
import ShimmerCard from '@/components/ShimmerCard';
import { useSite } from '@/components/SiteProvider';
import VideoCard from '@/components/VideoCard';

function HomeClient() {
  const [activeTab, setActiveTab] = useState<'home' | 'favorites'>('home');
  const [hotMovies, setHotMovies] = useState<DoubanItem[]>([]);
  const [hotTvShows, setHotTvShows] = useState<DoubanItem[]>([]);
  const [hotVarietyShows, setHotVarietyShows] = useState<DoubanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { announcement } = useSite();

  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // 检查公告弹窗状态
  useEffect(() => {
    if (typeof window !== 'undefined' && announcement) {
      const hasSeenAnnouncement = localStorage.getItem('hasSeenAnnouncement');
      if (hasSeenAnnouncement !== announcement) {
        setShowAnnouncement(true);
      } else {
        setShowAnnouncement(Boolean(!hasSeenAnnouncement && announcement));
      }
    }
  }, [announcement]);

  // 收藏夹数据
  type FavoriteItem = {
    id: string;
    source: string;
    title: string;
    poster: string;
    episodes: number;
    source_name: string;
    currentEpisode?: number;
    search_title?: string;
  };

  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    const fetchDoubanData = async () => {
      try {
        setLoading(true);

        // 并行获取热门电影、热门剧集和热门综艺
        const [moviesData, tvShowsData, varietyShowsData] = await Promise.all([
          getDoubanCategories({
            kind: 'movie',
            category: '热门',
            type: '全部',
          }),
          getDoubanCategories({ kind: 'tv', category: 'tv', type: 'tv' }),
          getDoubanCategories({ kind: 'tv', category: 'show', type: 'show' }),
        ]);

        if (moviesData.code === 200) {
          setHotMovies(moviesData.list);
        }

        if (tvShowsData.code === 200) {
          setHotTvShows(tvShowsData.list);
        }

        if (varietyShowsData.code === 200) {
          setHotVarietyShows(varietyShowsData.list);
        }
      } catch (error) {
        console.error('获取豆瓣数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoubanData();
  }, []);

  // 处理收藏数据更新的函数
  const updateFavoriteItems = async (allFavorites: Record<string, any>) => {
    const allPlayRecords = await getAllPlayRecords();

    // 根据保存时间排序（从近到远）
    const sorted = Object.entries(allFavorites)
      .sort(([, a], [, b]) => b.save_time - a.save_time)
      .map(([key, fav]) => {
        const plusIndex = key.indexOf('+');
        const source = key.slice(0, plusIndex);
        const id = key.slice(plusIndex + 1);

        // 查找对应的播放记录，获取当前集数
        const playRecord = allPlayRecords[key];
        const currentEpisode = playRecord?.index;

        return {
          id,
          source,
          title: fav.title,
          year: fav.year,
          poster: fav.cover,
          episodes: fav.total_episodes,
          source_name: fav.source_name,
          currentEpisode,
          search_title: fav?.search_title,
        } as FavoriteItem;
      });
    setFavoriteItems(sorted);
  };

  // 当切换到收藏夹时加载收藏数据
  useEffect(() => {
    if (activeTab !== 'favorites') return;

    const loadFavorites = async () => {
      const allFavorites = await getAllFavorites();
      await updateFavoriteItems(allFavorites);
    };

    loadFavorites();

    // 监听收藏更新事件
    const unsubscribe = subscribeToDataUpdates(
      'favoritesUpdated',
      (newFavorites: Record<string, any>) => {
        updateFavoriteItems(newFavorites);
      }
    );

    return unsubscribe;
  }, [activeTab]);

  const handleCloseAnnouncement = (announcement: string) => {
    setShowAnnouncement(false);
    localStorage.setItem('hasSeenAnnouncement', announcement); // 记录已查看弹窗
  };

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero Billboard - Only show on home tab */}
        {activeTab === 'home' && !loading && hotMovies.length > 0 && (
          <HeroBillboard
            title={hotMovies[0].title}
            poster={hotMovies[0].poster}
            year={hotMovies[0].year}
            rate={hotMovies[0].rate}
            douban_id={hotMovies[0].id}
          />
        )}

        <div className='px-2 sm:px-10 py-4 sm:py-8 overflow-visible'>
          {/* 顶部 Tab 切换 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='mb-8 flex justify-center'
          >
            <div className='bg-white/60 dark:bg-gray-800/40 rounded-2xl p-1.5 border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm shadow-lg'>
              <CapsuleSwitch
                options={[
                  { label: '首页', value: 'home' },
                  { label: '收藏夹', value: 'favorites' },
                ]}
                active={activeTab}
                onChange={(value) =>
                  setActiveTab(value as 'home' | 'favorites')
                }
              />
            </div>
          </motion.div>

          <div className='max-w-[95%] mx-auto'>
            {activeTab === 'favorites' ? (
              // 收藏夹视图
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className='mb-8'
              >
                <div className='mb-6 flex items-center justify-between bg-white/60 dark:bg-gray-800/40 rounded-2xl p-4 border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm shadow-lg'>
                  <div>
                    <h2 className='text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2'>
                      <span className='inline-block w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full'></span>
                      我的收藏
                    </h2>
                    {favoriteItems.length > 0 && (
                      <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                        共 {favoriteItems.length} 个收藏
                      </p>
                    )}
                  </div>
                  {favoriteItems.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className='px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium shadow-md'
                      onClick={async () => {
                        if (confirm('确定要清空所有收藏吗？此操作不可恢复。')) {
                          await clearAllFavorites();
                          setFavoriteItems([]);
                        }
                      }}
                    >
                      清空全部
                    </motion.button>
                  )}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className='justify-start grid grid-cols-3 gap-x-2 gap-y-14 sm:gap-y-20 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fill,_minmax(11rem,_1fr))] sm:gap-x-8'
                >
                  {favoriteItems.map((item, index) => (
                    <motion.div
                      key={item.id + item.source}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className='w-full'
                    >
                      <VideoCard
                        query={item.search_title}
                        {...item}
                        from='favorite'
                        type={item.episodes > 1 ? 'tv' : ''}
                      />
                    </motion.div>
                  ))}
                  {favoriteItems.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className='col-span-full'
                    >
                      <div className='flex flex-col items-center justify-center py-16 text-center'>
                        <div className='w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center'>
                          <svg
                            className='w-12 h-12 text-green-500'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                            />
                          </svg>
                        </div>
                        <h3 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2'>
                          还没有收藏内容
                        </h3>
                        <p className='text-gray-500 dark:text-gray-400 mb-6 max-w-md'>
                          浏览首页或搜索你喜欢的影视作品，点击爱心图标即可添加到收藏夹
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab('home')}
                          className='px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium shadow-lg transition-all'
                        >
                          去首页看看
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </motion.section>
            ) : (
              // 首页视图
              <>
                {/* 继续观看 */}
                <ContinueWatching />

                {/* 热门电影 */}
                <ContentRow title='热门电影' href='/douban?type=movie'>
                  {loading
                    ? // 加载状态显示灰色占位数据
                      Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={index}
                          className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                        >
                          <ShimmerCard className='relative aspect-[2/3] w-full' />
                          <ShimmerCard className='mt-2 h-4 w-full' />
                        </div>
                      ))
                    : // 显示真实数据
                      hotMovies.map((movie, index) => (
                        <div
                          key={index}
                          className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                        >
                          <VideoCard
                            from='douban'
                            title={movie.title}
                            poster={movie.poster}
                            douban_id={movie.id}
                            rate={movie.rate}
                            year={movie.year}
                            type='movie'
                          />
                        </div>
                      ))}
                </ContentRow>

                {/* 热门剧集 */}
                <ContentRow title='热门剧集' href='/douban?type=tv'>
                  {loading
                    ? // 加载状态显示灰色占位数据
                      Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={index}
                          className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                        >
                          <ShimmerCard className='relative aspect-[2/3] w-full' />
                          <ShimmerCard className='mt-2 h-4 w-full' />
                        </div>
                      ))
                    : // 显示真实数据
                      hotTvShows.map((show, index) => (
                        <div
                          key={index}
                          className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                        >
                          <VideoCard
                            from='douban'
                            title={show.title}
                            poster={show.poster}
                            douban_id={show.id}
                            rate={show.rate}
                            year={show.year}
                          />
                        </div>
                      ))}
                </ContentRow>

                {/* 热门综艺 */}
                <ContentRow title='热门综艺' href='/douban?type=show'>
                  {loading
                    ? // 加载状态显示灰色占位数据
                      Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={index}
                          className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                        >
                          <ShimmerCard className='relative aspect-[2/3] w-full' />
                          <ShimmerCard className='mt-2 h-4 w-full' />
                        </div>
                      ))
                    : // 显示真实数据
                      hotVarietyShows.map((show, index) => (
                        <div
                          key={index}
                          className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                        >
                          <VideoCard
                            from='douban'
                            title={show.title}
                            poster={show.poster}
                            douban_id={show.id}
                            rate={show.rate}
                            year={show.year}
                          />
                        </div>
                      ))}
                </ContentRow>
              </>
            )}
          </div>
        </div>
      </motion.div>
      {announcement && showAnnouncement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm dark:bg-black/70 p-4'
          onClick={() => handleCloseAnnouncement(announcement)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className='w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900'
          >
            <div className='flex justify-between items-start mb-4'>
              <h3 className='text-2xl font-bold tracking-tight text-gray-800 dark:text-white border-b border-green-500 pb-1'>
                提示
              </h3>
            </div>
            <div className='mb-6'>
              <div className='relative overflow-hidden rounded-lg mb-4 bg-green-50 dark:bg-green-900/20'>
                <div className='absolute inset-y-0 left-0 w-1.5 bg-green-500 dark:bg-green-400'></div>
                <p className='ml-4 py-3 text-gray-600 dark:text-gray-300 leading-relaxed'>
                  {announcement}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCloseAnnouncement(announcement)}
              className='w-full rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 text-white font-medium shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 transition-all duration-300'
            >
              我知道了
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </PageLayout>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeClient />
    </Suspense>
  );
}
