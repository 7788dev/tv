/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */
'use client';

import { motion } from 'framer-motion';
import { ChevronUp, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import {
  addSearchHistory,
  clearSearchHistory,
  deleteSearchHistory,
  getSearchHistory,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { SearchResult } from '@/lib/types';
import { yellowWords } from '@/lib/yellow';

import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';

function SearchPageClient() {
  // 搜索历史
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  // 返回顶部按钮显示状态
  const [showBackToTop, setShowBackToTop] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // 筛选状态
  const [showFilters, setShowFilters] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'year' | 'title'>(
    'relevance'
  );

  // 获取默认聚合设置：只读取用户本地设置，默认为 true
  const getDefaultAggregate = () => {
    if (typeof window !== 'undefined') {
      const userSetting = localStorage.getItem('defaultAggregateSearch');
      if (userSetting !== null) {
        return JSON.parse(userSetting);
      }
    }
    return true; // 默认启用聚合
  };

  const [viewMode, setViewMode] = useState<'agg' | 'all'>(() => {
    return getDefaultAggregate() ? 'agg' : 'all';
  });

  // 获取所有可用的年份、来源和类型
  const availableFilters = useMemo(() => {
    const years = new Set<string>();
    const sources = new Set<string>();
    const types = new Set<string>();

    searchResults.forEach((item) => {
      if (item.year && item.year !== 'unknown') {
        years.add(item.year);
      }
      if (item.source_name) {
        sources.add(item.source_name);
      }
      // 根据集数判断类型
      const itemType = item.episodes.length === 1 ? '电影' : '电视剧';
      types.add(itemType);
    });

    return {
      years: Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)),
      sources: Array.from(sources).sort(),
      types: Array.from(types).sort(),
    };
  }, [searchResults]);

  // 应用筛选和排序
  const filteredResults = useMemo(() => {
    let filtered = [...searchResults];

    // 应用年份筛选
    if (selectedYear !== 'all') {
      filtered = filtered.filter((item) => item.year === selectedYear);
    }

    // 应用来源筛选
    if (selectedSource !== 'all') {
      filtered = filtered.filter((item) => item.source_name === selectedSource);
    }

    // 应用类型筛选
    if (selectedType !== 'all') {
      const isMovie = selectedType === '电影';
      filtered = filtered.filter((item) =>
        isMovie ? item.episodes.length === 1 : item.episodes.length > 1
      );
    }

    // 应用排序
    filtered.sort((a, b) => {
      if (sortBy === 'relevance') {
        // 优先排序：标题与搜索词完全一致的排在前面
        const aExactMatch = a.title === searchQuery.trim();
        const bExactMatch = b.title === searchQuery.trim();

        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;

        // 如果都匹配或都不匹配，则按年份排序
        if (a.year === b.year) {
          return a.title.localeCompare(b.title);
        } else {
          if (a.year === 'unknown' && b.year === 'unknown') return 0;
          if (a.year === 'unknown') return 1;
          if (b.year === 'unknown') return -1;
          return parseInt(a.year) > parseInt(b.year) ? -1 : 1;
        }
      } else if (sortBy === 'year') {
        if (a.year === b.year) {
          return a.title.localeCompare(b.title);
        }
        if (a.year === 'unknown' && b.year === 'unknown') return 0;
        if (a.year === 'unknown') return 1;
        if (b.year === 'unknown') return -1;
        return parseInt(a.year) > parseInt(b.year) ? -1 : 1;
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return filtered;
  }, [
    searchResults,
    selectedYear,
    selectedSource,
    selectedType,
    sortBy,
    searchQuery,
  ]);

  // 聚合后的结果（按标题和年份分组）
  const aggregatedResults = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    filteredResults.forEach((item) => {
      // 使用 title + year + type 作为键，year 必然存在，但依然兜底 'unknown'
      const key = `${item.title.replaceAll(' ', '')}-${
        item.year || 'unknown'
      }-${item.episodes.length === 1 ? 'movie' : 'tv'}`;
      const arr = map.get(key) || [];
      arr.push(item);
      map.set(key, arr);
    });
    return Array.from(map.entries()).sort((a, b) => {
      // 优先排序：标题与搜索词完全一致的排在前面
      const aExactMatch = a[1][0].title
        .replaceAll(' ', '')
        .includes(searchQuery.trim().replaceAll(' ', ''));
      const bExactMatch = b[1][0].title
        .replaceAll(' ', '')
        .includes(searchQuery.trim().replaceAll(' ', ''));

      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;

      // 年份排序
      if (a[1][0].year === b[1][0].year) {
        return a[0].localeCompare(b[0]);
      } else {
        // 处理 unknown 的情况
        const aYear = a[1][0].year;
        const bYear = b[1][0].year;

        if (aYear === 'unknown' && bYear === 'unknown') {
          return 0;
        } else if (aYear === 'unknown') {
          return 1; // a 排在后面
        } else if (bYear === 'unknown') {
          return -1; // b 排在后面
        } else {
          // 都是数字年份，按数字大小排序（大的在前面）
          return aYear > bYear ? -1 : 1;
        }
      }
    });
  }, [filteredResults, searchQuery]);

  useEffect(() => {
    // 无搜索参数时聚焦搜索框
    !searchParams.get('q') && document.getElementById('searchInput')?.focus();

    // 初始加载搜索历史
    getSearchHistory().then(setSearchHistory);

    // 监听搜索历史更新事件
    const unsubscribe = subscribeToDataUpdates(
      'searchHistoryUpdated',
      (newHistory: string[]) => {
        setSearchHistory(newHistory);
      }
    );

    // 获取滚动位置的函数 - 专门针对 body 滚动
    const getScrollTop = () => {
      return document.body.scrollTop || 0;
    };

    // 使用 requestAnimationFrame 持续检测滚动位置
    let isRunning = false;
    const checkScrollPosition = () => {
      if (!isRunning) return;

      const scrollTop = getScrollTop();
      const shouldShow = scrollTop > 300;
      setShowBackToTop(shouldShow);

      requestAnimationFrame(checkScrollPosition);
    };

    // 启动持续检测
    isRunning = true;
    checkScrollPosition();

    // 监听 body 元素的滚动事件
    const handleScroll = () => {
      const scrollTop = getScrollTop();
      setShowBackToTop(scrollTop > 300);
    };

    document.body.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      unsubscribe();
      isRunning = false; // 停止 requestAnimationFrame 循环

      // 移除 body 滚动事件监听器
      document.body.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // 当搜索参数变化时更新搜索状态
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      fetchSearchResults(query);

      // 保存到搜索历史 (事件监听会自动更新界面)
      addSearchHistory(query);
    } else {
      setShowResults(false);
    }
  }, [searchParams]);

  const fetchSearchResults = async (query: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query.trim())}`
      );
      const data = await response.json();
      let results = data.results;
      if (
        typeof window !== 'undefined' &&
        !(window as any).RUNTIME_CONFIG?.DISABLE_YELLOW_FILTER
      ) {
        results = results.filter((result: SearchResult) => {
          const typeName = result.type_name || '';
          return !yellowWords.some((word: string) => typeName.includes(word));
        });
      }
      setSearchResults(
        results.sort((a: SearchResult, b: SearchResult) => {
          // 优先排序：标题与搜索词完全一致的排在前面
          const aExactMatch = a.title === query.trim();
          const bExactMatch = b.title === query.trim();

          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;

          // 如果都匹配或都不匹配，则按原来的逻辑排序
          if (a.year === b.year) {
            return a.title.localeCompare(b.title);
          } else {
            // 处理 unknown 的情况
            if (a.year === 'unknown' && b.year === 'unknown') {
              return 0;
            } else if (a.year === 'unknown') {
              return 1; // a 排在后面
            } else if (b.year === 'unknown') {
              return -1; // b 排在后面
            } else {
              // 都是数字年份，按数字大小排序（大的在前面）
              return parseInt(a.year) > parseInt(b.year) ? -1 : 1;
            }
          }
        })
      );
      setShowResults(true);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim().replace(/\s+/g, ' ');
    if (!trimmed) return;

    // 回显搜索框
    setSearchQuery(trimmed);
    setIsLoading(true);
    setShowResults(true);

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    // 直接发请求
    fetchSearchResults(trimmed);

    // 保存到搜索历史 (事件监听会自动更新界面)
    addSearchHistory(trimmed);
  };

  // 返回顶部功能
  const scrollToTop = () => {
    try {
      // 根据调试结果，真正的滚动容器是 document.body
      document.body.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      // 如果平滑滚动完全失败，使用立即滚动
      document.body.scrollTop = 0;
    }
  };

  // 清空所有筛选
  const clearAllFilters = () => {
    setSelectedYear('all');
    setSelectedSource('all');
    setSelectedType('all');
    setSortBy('relevance');
  };

  // 检查是否有激活的筛选条件
  const hasActiveFilters =
    selectedYear !== 'all' ||
    selectedSource !== 'all' ||
    selectedType !== 'all' ||
    sortBy !== 'relevance';

  return (
    <PageLayout activePath='/search'>
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible mb-10'>
        {/* 搜索框 */}
        <div className='mb-8'>
          <form onSubmit={handleSearch} className='max-w-3xl mx-auto'>
            <div className='relative group'>
              <Search className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-green-500' />
              <input
                id='searchInput'
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='搜索电影、电视剧、综艺...'
                className='w-full h-14 rounded-2xl bg-white dark:bg-gray-800 py-3 pl-12 pr-4 text-base text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300'
              />
              {searchQuery && (
                <button
                  type='button'
                  onClick={() => setSearchQuery('')}
                  className='absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors'
                  aria-label='清空搜索'
                >
                  <X className='w-5 h-5 text-gray-400 dark:text-gray-500' />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 搜索结果或搜索历史 */}
        <div className='max-w-[95%] mx-auto mt-12 overflow-visible'>
          {isLoading ? (
            <div className='flex justify-center items-center h-40'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-500'></div>
            </div>
          ) : showResults ? (
            <section className='mb-12'>
              {/* 标题 + 控制栏 */}
              <div className='mb-6 space-y-4'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                    搜索结果
                    {filteredResults.length > 0 && (
                      <span className='ml-2 text-sm font-normal text-gray-500 dark:text-gray-400'>
                        ({filteredResults.length} 条结果)
                      </span>
                    )}
                  </h2>
                  <div className='flex items-center gap-4'>
                    {/* 筛选按钮 */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        showFilters
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <SlidersHorizontal className='w-4 h-4' />
                      <span className='hidden sm:inline'>筛选</span>
                      {hasActiveFilters && (
                        <span className='w-2 h-2 bg-red-500 rounded-full'></span>
                      )}
                    </button>
                    {/* 聚合开关 */}
                    <label className='flex items-center gap-2 cursor-pointer select-none'>
                      <span className='text-sm text-gray-700 dark:text-gray-300 hidden sm:inline'>
                        聚合
                      </span>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={viewMode === 'agg'}
                          onChange={() =>
                            setViewMode(viewMode === 'agg' ? 'all' : 'agg')
                          }
                        />
                        <div className='w-9 h-5 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600'></div>
                        <div className='absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4'></div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 筛选面板 */}
                {showFilters && (
                  <div className='bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-300'>
                    <div className='flex items-center justify-between mb-2'>
                      <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2'>
                        <Filter className='w-4 h-4' />
                        精细筛选
                      </h3>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className='text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors'
                        >
                          清空筛选
                        </button>
                      )}
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                      {/* 年份筛选 */}
                      {availableFilters.years.length > 0 && (
                        <div>
                          <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2'>
                            年份
                          </label>
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className='w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all'
                          >
                            <option value='all'>全部年份</option>
                            {availableFilters.years.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* 来源筛选 */}
                      {availableFilters.sources.length > 0 && (
                        <div>
                          <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2'>
                            来源
                          </label>
                          <select
                            value={selectedSource}
                            onChange={(e) => setSelectedSource(e.target.value)}
                            className='w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all'
                          >
                            <option value='all'>全部来源</option>
                            {availableFilters.sources.map((source) => (
                              <option key={source} value={source}>
                                {source}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* 类型筛选 */}
                      {availableFilters.types.length > 0 && (
                        <div>
                          <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2'>
                            类型
                          </label>
                          <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className='w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all'
                          >
                            <option value='all'>全部类型</option>
                            {availableFilters.types.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* 排序方式 */}
                      <div>
                        <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2'>
                          排序方式
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) =>
                            setSortBy(
                              e.target.value as 'relevance' | 'year' | 'title'
                            )
                          }
                          className='w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all'
                        >
                          <option value='relevance'>相关度</option>
                          <option value='year'>年份</option>
                          <option value='title'>标题</option>
                        </select>
                      </div>
                    </div>

                    {/* 激活的筛选标签 */}
                    {hasActiveFilters && (
                      <div className='flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700'>
                        {selectedYear !== 'all' && (
                          <span className='inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full'>
                            年份: {selectedYear}
                            <button
                              onClick={() => setSelectedYear('all')}
                              className='hover:text-green-900 dark:hover:text-green-100'
                            >
                              <X className='w-3 h-3' />
                            </button>
                          </span>
                        )}
                        {selectedSource !== 'all' && (
                          <span className='inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full'>
                            来源: {selectedSource}
                            <button
                              onClick={() => setSelectedSource('all')}
                              className='hover:text-blue-900 dark:hover:text-blue-100'
                            >
                              <X className='w-3 h-3' />
                            </button>
                          </span>
                        )}
                        {selectedType !== 'all' && (
                          <span className='inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full'>
                            类型: {selectedType}
                            <button
                              onClick={() => setSelectedType('all')}
                              className='hover:text-purple-900 dark:hover:text-purple-100'
                            >
                              <X className='w-3 h-3' />
                            </button>
                          </span>
                        )}
                        {sortBy !== 'relevance' && (
                          <span className='inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full'>
                            排序: {sortBy === 'year' ? '年份' : '标题'}
                            <button
                              onClick={() => setSortBy('relevance')}
                              className='hover:text-orange-900 dark:hover:text-orange-100'
                            >
                              <X className='w-3 h-3' />
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div
                key={`search-results-${viewMode}`}
                className='justify-start grid grid-cols-3 gap-x-2 gap-y-14 sm:gap-y-20 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fill,_minmax(11rem,_1fr))] sm:gap-x-8'
              >
                {viewMode === 'agg'
                  ? aggregatedResults.map(([mapKey, group]) => {
                      return (
                        <div key={`agg-${mapKey}`} className='w-full'>
                          <VideoCard
                            from='search'
                            items={group}
                            query={
                              searchQuery.trim() !== group[0].title
                                ? searchQuery.trim()
                                : ''
                            }
                          />
                        </div>
                      );
                    })
                  : filteredResults.map((item) => (
                      <div
                        key={`all-${item.source}-${item.id}`}
                        className='w-full'
                      >
                        <VideoCard
                          id={item.id}
                          title={item.title + ' ' + item.type_name}
                          poster={item.poster}
                          episodes={item.episodes.length}
                          source={item.source}
                          source_name={item.source_name}
                          douban_id={item.douban_id?.toString()}
                          query={
                            searchQuery.trim() !== item.title
                              ? searchQuery.trim()
                              : ''
                          }
                          year={item.year}
                          from='search'
                          type={item.episodes.length > 1 ? 'tv' : 'movie'}
                        />
                      </div>
                    ))}
                {filteredResults.length === 0 && searchResults.length > 0 && (
                  <div className='col-span-full text-center text-gray-500 py-8 dark:text-gray-400'>
                    未找到符合筛选条件的结果
                  </div>
                )}
                {searchResults.length === 0 && (
                  <div className='col-span-full text-center text-gray-500 py-8 dark:text-gray-400'>
                    未找到相关结果
                  </div>
                )}
              </div>
            </section>
          ) : searchHistory.length > 0 ? (
            // 搜索历史
            <section className='mb-12'>
              <div className='bg-white/60 dark:bg-gray-800/40 rounded-2xl p-6 border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm shadow-lg'>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2'>
                    <span className='inline-block w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full'></span>
                    搜索历史
                  </h2>
                  {searchHistory.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('确定要清空所有搜索历史吗？')) {
                          clearSearchHistory();
                        }
                      }}
                      className='px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium shadow-md'
                    >
                      清空历史
                    </button>
                  )}
                </div>
                <div className='flex flex-wrap gap-3'>
                  {searchHistory.map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className='relative group'
                    >
                      <button
                        onClick={() => {
                          setSearchQuery(item);
                          router.push(
                            `/search?q=${encodeURIComponent(item.trim())}`
                          );
                        }}
                        className='px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-green-500 hover:to-green-600 hover:text-white rounded-full text-sm text-gray-700 transition-all duration-300 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300 dark:hover:from-green-500 dark:hover:to-green-600 shadow-sm hover:shadow-md font-medium'
                      >
                        {item}
                      </button>
                      {/* 删除按钮 */}
                      <button
                        aria-label='删除搜索历史'
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          deleteSearchHistory(item);
                        }}
                        className='absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all shadow-md'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {/* 返回顶部悬浮按钮 */}
      <motion.button
        onClick={scrollToTop}
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: showBackToTop ? 1 : 0,
          y: showBackToTop ? 0 : 20,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-20 md:bottom-8 right-6 md:right-8 z-[500] w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-xl hover:shadow-2xl backdrop-blur-sm transition-all duration-300 ease-in-out flex items-center justify-center group ${
          showBackToTop ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-label='返回顶部'
      >
        <ChevronUp className='w-6 h-6 md:w-7 md:h-7 transition-transform group-hover:-translate-y-1' />
      </motion.button>
    </PageLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  );
}
