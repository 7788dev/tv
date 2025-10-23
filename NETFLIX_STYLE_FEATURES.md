# Netflix 风格 UI 和动画特性

本项目已实现 Netflix 风格的流媒体网站组件样式和动画效果。

## 🎬 新增组件

### 1. HeroBillboard (英雄横幅)

**位置**: `src/components/HeroBillboard.tsx`

Netflix 风格的大型横幅组件，用于首页顶部展示精选内容：

- 全屏响应式背景图片
- 渐变遮罩层增强可读性
- 平滑的入场动画（标题、元信息、描述逐个淡入）
- 播放和更多信息按钮
- 可选的音量控制按钮
- 年龄分级标识

### 2. ContentRow (内容行)

**位置**: `src/components/ContentRow.tsx`

带有视口滚动触发动画的内容行组件：

- 滚动到视口时触发入场动画
- 子元素错开显示效果（stagger animation）
- 支持标题、链接、清空按钮
- 集成 ScrollableRow 实现横向滚动

### 3. ShimmerCard (闪光加载卡片)

**位置**: `src/components/ShimmerCard.tsx`

Netflix 风格的骨架屏加载效果：

- 平滑的闪光动画
- 可自定义尺寸和形状
- 比简单的脉冲动画更精致

### 4. PageTransition (页面过渡)

**位置**: `src/components/PageTransition.tsx`

页面级别的过渡动画包装器：

- 进入/退出动画
- 自定义缓动函数
- 可复用于任何页面

## 🎨 增强的现有组件

### VideoCard (视频卡片)

**更新**: `src/components/VideoCard.tsx`

全面增强的 Netflix 风格卡片：

- **悬停效果**:
  - 平滑的缩放动画 (scale 1.05)
  - 深度阴影增强
  - 渐变遮罩从底部升起
- **交互元素**:
  - 播放按钮带有弹簧动画
  - 收藏和删除图标带有缩放反馈
  - 豆瓣链接滑入动画
- **进度条**:
  - 动画填充效果
  - 平滑的宽度过渡
- **入场动画**:
  - 淡入 + 向上滑动
  - 标题和来源信息错开显示

### ScrollableRow (可滚动行)

**更新**: `src/components/ScrollableRow.tsx`

改进的横向滚动容器：

- **导航按钮**:
  - 悬停时从侧边滑入
  - 圆形按钮带有阴影
  - 点击时缩放反馈
- **平滑滚动**:
  - 支持触摸滑动
  - 自动检测滚动边界

### ContinueWatching (继续观看)

**更新**: `src/components/ContinueWatching.tsx`

集成 ContentRow 实现统一的动画体验：

- 使用 ShimmerCard 替代简单的脉冲加载
- 清空按钮带有交互动画
- 与其他内容行保持一致的视觉风格

### HomePage (首页)

**更新**: `src/app/page.tsx`

完整的 Netflix 风格首页体验：

- **Hero 横幅**: 顶部展示热门电影
- **内容区块**:
  - 继续观看
  - 热门电影
  - 热门剧集
  - 热门综艺
- **Tab 切换**: 首页/收藏夹带有淡入动画
- **收藏夹网格**: 卡片错开显示动画
- **公告弹窗**: 弹性动画 + 模糊背景

## 🎭 全局样式增强

**更新**: `src/app/globals.css`

### 新增 CSS 特性:

1. **视频卡片悬停**:

   - 3D transform 优化性能
   - Netflix 风格的阴影层次

2. **渐变遮罩**:

   - 更深、更平滑的渐变
   - 多层次的透明度控制

3. **Shimmer 动画**:

   - 闪光扫过效果
   - 可复用的 CSS 类

4. **卡片阴影系统**:

   - card-shadow-sm/md/lg/xl
   - 统一的阴影层次

5. **平滑滚动**:
   - 原生滚动行为优化
   - 移动端触摸滚动支持

## 🚀 技术栈

- **Framer Motion**: 核心动画库
- **React**: 组件框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式系统
- **Next.js**: 应用框架

## 🎯 动画特点

### 1. 入场动画

- 页面加载时淡入
- 元素错开显示（stagger）
- 视口滚动触发

### 2. 交互动画

- 悬停缩放 + 阴影
- 点击反馈（tap scale）
- 按钮状态过渡

### 3. 加载动画

- Shimmer 闪光效果
- 进度条填充
- 骨架屏占位

### 4. 过渡动画

- 页面切换
- Tab 切换
- 模态框弹出

## 📱 响应式设计

所有动画和组件都支持：

- 移动端触摸交互
- 平板电脑中等屏幕
- 桌面大屏幕
- 自适应布局

## 🎨 视觉设计原则

遵循 Netflix 的设计哲学：

1. **简洁**: 内容为王，减少干扰
2. **流畅**: 所有交互都有平滑的动画
3. **反馈**: 每个操作都有视觉响应
4. **层次**: 使用阴影和缩放建立深度感
5. **性能**: 使用 transform 和 opacity 优化动画

## 🔄 动画性能优化

- 使用`will-change`提示浏览器
- Transform 代替 position 变化
- GPU 加速的 CSS 属性
- 防抖和节流
- 懒加载和视口检测

## 🌙 深色模式支持

所有组件都支持深色主题：

- 自动适配的渐变和阴影
- 主题切换时的平滑过渡
- 统一的颜色变量

## 📝 使用示例

### 使用 HeroBillboard:

```tsx
<HeroBillboard
  title='电影标题'
  poster='海报URL'
  backdrop='背景图URL'
  year='2024'
  rate='8.5'
  douban_id='123456'
/>
```

### 使用 ContentRow:

```tsx
<ContentRow title='热门电影' href='/movies'>
  {movies.map((movie) => (
    <VideoCard key={movie.id} {...movie} />
  ))}
</ContentRow>
```

### 使用 ShimmerCard:

```tsx
<ShimmerCard className='w-full h-64' />
```

## 🎉 总结

通过这些组件和动画，项目现在具备了专业级流媒体平台的视觉效果和用户体验，与 Netflix、Disney+等主流平台的交互质量相当。
