<script setup>
import { onMounted, ref, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from 'pinia';
import fetchWrapper from "@/utils/fetchWrapper.js";
import { cleanText } from "@/utils/cleanText";
import { chatApi } from '@/api/chat.js';
import { usechatAIstore } from '@/stores/chatAI.js';

// ==========================================
// 1. 全局配置与常量定义 (Constants)
// ==========================================
const BASE_URL = import.meta.env.VITE_APP_API_URL || '';
const DEFAULT_COVER = 'https://img.js.design/assets/img/64251786576643916999a073.png';

const CONFIG = {
  HIDE_CONTROLS_DELAY: 3000,   // 控制栏自动隐藏延时 (ms)
  AUTO_PLAY_DELAY: 200,        // 数据加载后自动播放延时 (ms)
  MAX_RECOMMEND_COUNT: 10      // 侧边栏最大推荐数量
};

// ==========================================
// 2. 路由与全局状态注入 (Hooks & Stores)
// ==========================================
const route = useRoute();
const router = useRouter();
const chatAIstore = usechatAIstore();
const { conversation_id } = storeToRefs(chatAIstore);

// ==========================================
// 3. 响应式状态定义 (Reactive State)
// ==========================================

// DOM 引用
const videoPlayer = ref(null);     // <video> 标签实例
const playerContainer = ref(null); // 播放器最外层容器（用于全屏）

// 数据状态
const video = ref({});             // 当前视频详细数据
const subtitles = ref([]);         // 当前视频字幕列表
const recommendList = ref([]);     // 侧边推荐列表
const loading = ref(true);         // 全局加载状态

// 播放器交互状态
const isPlaying = ref(false);      // 播放/暂停状态
const progress = ref(0);           // 进度条百分比 (0-100)
const currentTimeStr = ref("00:00"); // 当前时间格式化文本
const durationStr = ref("00:00");  // 总时长格式化文本
const isFullScreen = ref(false);   // 是否全屏
const showControls = ref(true);    // 控制栏可见性
let hideTimer = null;              // 控制栏隐藏定时器句柄

// AI 模块交互状态
const isZMode = ref(false);        // 趣味转译模式开关
const currentSubtitle = ref("");   // 实时显示的字幕内容
const isAiExpanded = ref(false);   // 侧边栏 AI 模块展开状态
const fullDramAnalysis = ref("");  // AI 全剧解析文本结果
const isFetchingAi = ref(false);   // 防止 AI 接口并发请求的锁

// ==========================================
// 4. 纯函数与工具类 (Pure Functions)
// ==========================================

/**
 * 格式化秒数为 MM:SS 格式
 * @param {number} seconds - 视频秒数
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 获取完整的封面图片 URL
 * @param {string} coverPath - 相对路径或绝对路径
 * @returns {string} 完整的图片 URL
 */
const getFullCover = (coverPath) => {
  if (!coverPath) return DEFAULT_COVER;
  if (coverPath.startsWith('http')) return coverPath;
  const pathParts = coverPath.split('/');
  const fileName = pathParts.pop();
  const folder = pathParts.join('/');
  return `${BASE_URL}${folder}/${encodeURIComponent(fileName)}`;
};

// ==========================================
// 5. 播放器核心交互逻辑 (Player Controls)
// ==========================================

/**
 * 重置并重新启动控制栏隐藏定时器
 */
const resetHideTimer = () => {
  showControls.value = true;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (isPlaying.value) {
    hideTimer = setTimeout(() => { 
      showControls.value = false; 
    }, CONFIG.HIDE_CONTROLS_DELAY);
  }
};

/**
 * 切换视频播放/暂停状态
 */
const togglePlay = () => {
  if (!videoPlayer.value) return;
  
  if (videoPlayer.value.paused) {
    videoPlayer.value.play().catch(err => console.warn("Play interrupted:", err));
    isPlaying.value = true;
  } else {
    videoPlayer.value.pause();
    isPlaying.value = false;
  }
  resetHideTimer();
};

/**
 * 处理进度条点击跳转
 * @param {MouseEvent} e - 点击事件对象
 */
const seek = (e) => {
  if (!videoPlayer.value || !videoPlayer.value.duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  videoPlayer.value.currentTime = pos * videoPlayer.value.duration;
  resetHideTimer();
};

/**
 * 监听视频播放时间更新，同步进度条与字幕
 */
const handleTimeUpdate = () => {
  const v = videoPlayer.value;
  if (!v || !v.duration) return;

  const time = v.currentTime;
  progress.value = (time / v.duration) * 100;
  currentTimeStr.value = formatTime(time);

  if (!subtitles.value || subtitles.value.length === 0) return;

  // 构建当前模式下需要匹配的字幕轨道数据
  const activeData = subtitles.value.map(s => ({
    start: s.start_time,
    end: s.end_time,
    content: isZMode.value ? s.translation : s.content
  }));

  const match = activeData.find(item => time >= item.start && time <= item.end);
  const nextText = match ? match.content : "";

  // 仅当字幕内容发生变化时才触发响应式更新，减少重绘性能消耗
  if (currentSubtitle.value !== nextText) {
    currentSubtitle.value = nextText;
  }
};

/**
 * 视频元数据加载完成时的处理
 */
const onLoadedMetadata = () => {
  if (videoPlayer.value) {
    durationStr.value = formatTime(videoPlayer.value.duration);
  }
};

/**
 * 切换全屏模式
 */
const toggleFullScreen = () => {
  if (!playerContainer.value) return;

  if (!document.fullscreenElement) {
    playerContainer.value.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable full-screen mode: ${err.message}`);
    });
    isFullScreen.value = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

/**
 * 监听系统级的全屏状态变化 (用于按 ESC 退出全屏的场景)
 */
const handleFullscreenChange = () => {
  isFullScreen.value = !!document.fullscreenElement;
  if (!isFullScreen.value) {
    showControls.value = true;
  }
};

// ==========================================
// 6. 网络请求与业务逻辑 (API Calling)
// ==========================================

/**
 * 初始化加载视频资源、推荐列表及字幕数据
 * @param {string|number} videoId - 视频的唯一标识
 */
const loadData = async (videoId) => {
  if (!videoId) return;
  loading.value = true;
  
  try {
    // 1. 并发请求以提升加载速度 (若接口支持)
    const [videoRes, listRes, subtitleRes] = await Promise.all([
      fetchWrapper(`/video/list/${videoId}`),
      fetchWrapper(`/video/list`),
      fetchWrapper(`/subtitles/${videoId}`).catch(err => {
        console.warn("Subtitle load failed:", err);
        return { subtitles: [] }; // 降级处理：字幕加载失败不影响主流程
      })
    ]);

    // 2. 处理当前视频数据
    if (videoRes?.data) {
      const data = videoRes.data;
      const pathParts = data.url.split('/');
      const fileName = pathParts.pop();
      const folder = pathParts.join('/');
      data.fullUrl = `${BASE_URL}${folder}/${encodeURIComponent(fileName)}`;
      video.value = data;

      // 延迟触发自动播放，确保 DOM 与资源就绪
      setTimeout(() => {
        if (videoPlayer.value) {
          videoPlayer.value.load();
          videoPlayer.value.play().then(() => {
            isPlaying.value = true;
            resetHideTimer();
          }).catch(err => console.warn("Auto-play blocked by browser policy:", err));
        }
      }, CONFIG.AUTO_PLAY_DELAY);
    }

    // 3. 处理推荐列表数据
    if (listRes?.data) {
      const filtered = listRes.data.filter(item => String(item.id) !== String(videoId));
      // 洗牌算法简化版，截取指定数量
      const shuffled = filtered.sort(() => 0.5 - Math.random());
      recommendList.value = shuffled.slice(0, CONFIG.MAX_RECOMMEND_COUNT).map(item => ({
        ...item,
        fullCover: getFullCover(item.cover)
      }));
    }

    // 4. 处理字幕数据
    subtitles.value = subtitleRes?.subtitles || [];

  } catch (err) {
    console.error("Load Data Failed:", err);
    // 这里可以接入全局错误提示插件，例如：ElMessage.error("视频加载失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 调用 AI 接口获取剧目深度解析
 */
const fetchFullAnalysis = async () => {
  // 双重保险：确保有视频标题作为 Prompt 的基准
  if (!video.value?.title) {
    await loadData(route.params.id); 
  }

  if (!video.value?.title) {
    fullDramAnalysis.value = "当前视频标题缺失，暂时无法生成全剧解读。";
    return;
  }

  if (isFetchingAi.value) return;

  // 初始化 UI 状态
  isAiExpanded.value = true;
  fullDramAnalysis.value = "正在调动AI专家进行深度解析..."; 
  isFetchingAi.value = true;

  try {
    // 确保与 AI Agent 的会话建立成功
    await chatAIstore.createConversation();
    if (!conversation_id.value) {
      throw new Error("Conversation ID initialization failed");
    }

    const cleanedTitle = video.value.title.replace(/\[.*?\]/g, "").trim();
    const analysisPrompt = `剧目名称：${cleanedTitle}。请作为晋剧研究专家，从以下三个维度进行深度解读\n1. 人物关系映射\n2. 服饰与演员表现\n3. 唱腔艺术特点`;
    
    // 调用大模型对话接口
    const res = await chatApi.sendChatMessage(analysisPrompt, conversation_id.value);
    
    if (res?.data?.answer) {
      fullDramAnalysis.value = cleanText(res.data.answer);
    } else {
      fullDramAnalysis.value = "生成内容为空，请稍后重试。";
    }
  } catch (err) {
    console.error("AI Analysis flow error:", err);
    fullDramAnalysis.value = `解析失败：${err.message || "网络波动，请检查连接"}`;
  } finally {
    isFetchingAi.value = false;
  }
};

// ==========================================
// 7. 路由跳转控制 (Routing)
// ==========================================

const goToVideoList = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  router.push("/video");
};

const switchVideo = (id) => {
  if (String(route.params.id) === String(id)) return;
  router.push(`/player/${id}`);
};

// ==========================================
// 8. 生命周期与副作用监听 (Lifecycle & Watchers)
// ==========================================

// 监听路由参数变化，实现页面复用时的数据刷新
watch(
  () => route.params.id, 
  async (newId) => {
    if (newId) {
      // 切换剧目时重置各类核心状态
      fullDramAnalysis.value = ""; 
      isAiExpanded.value = false;
      currentSubtitle.value = "";
      isPlaying.value = false;
      await loadData(newId); 
    }
  },
  { immediate: true }
);

onMounted(() => {
  // 注册全局事件
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onUnmounted(() => {
  // 销毁定时器，防止内存泄漏
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  // 注销全局事件监听
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});

</script>
<template>
  <div class="player-page">
    <div class="content-wrapper">
      <header class="player-header" v-if="!isFullScreen">
        <button @click="goToVideoList" class="back-btn">← 返回列表</button>
        <h2 class="video-title">{{ video.title }}</h2>
      </header>

      <div class="layout-body">
        <main class="main-content">
          <div v-if="loading" class="loading-state">视频资源调取中...</div>

          <div v-else-if="video.title" class="player-wrapper">
            <div 
              class="video-container" 
              ref="playerContainer"
              :class="{ 'hide-cursor': !showControls }"
              @mousemove="resetHideTimer"
            >
              <video
                ref="videoPlayer"
                class="video-el"
                :src="video.fullUrl"
                @timeupdate="handleTimeUpdate"
                @loadedmetadata="onLoadedMetadata"
                @click="togglePlay"
              ></video>

              <Transition name="pop">
                <div v-if="currentSubtitle" class="ai-box">
                  <div class="ai-content">
                    <span class="ai-tag">{{ isZMode ? '趣味解读' : '原唱词' }}</span>
                    {{ currentSubtitle }}
                  </div>
                </div>
              </Transition>

              <div class="control-bar" :class="{ 'is-hidden': !showControls }">
                <div class="progress-wrap" @click.stop="seek">
                  <div class="bar-bg">
                    <div class="bar-active" :style="{ width: progress + '%' }"></div>
                  </div>
                </div>

                <div class="bar-btns">
                  <div class="group">
                    <button @click.stop="togglePlay" class="icon-btn">
                      {{ isPlaying ? '⏸' : '▶' }}
                    </button>
                    <div class="time-display">
                      <span class="cur">{{ currentTimeStr }}</span>
                      <span class="split">/</span>
                      <span class="dur">{{ durationStr }}</span>
                    </div>
                  </div>

                  <div class="group">
                    <button 
                      @click.stop="isZMode = !isZMode" 
                      :class="['mode-btn', { active: isZMode }]"
                    >
                      {{ isZMode ? '词段趣解: ON' : '开启 AI 趣解' }}
                    </button>
                    <button @click.stop="toggleFullScreen" class="icon-btn">
                      {{ isFullScreen ? '🔲' : '🔳' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <!-- 晋剧推荐 -->
        <aside class="sidebar" v-if="!isFullScreen">
          <div class="ai-dropdown-section" :class="{ 'is-active': isAiExpanded }">
              <div class="ai-dropdown-header" @click="isAiExpanded = !isAiExpanded">
                  <div class="header-left">
                      <span class="title">AI 全剧深度解读</span>
                      <button 
                          class="ai-gen-btn" 
                          :disabled="isFetchingAi"
                          @click.stop="fetchFullAnalysis"
                      >
                          {{ isFetchingAi ? '生成中...' : (fullDramAnalysis ? '重新生成' : '一键生成') }}
                      </button>
                  </div>
                  <span class="arrow-icon">{{ isAiExpanded ? '▼' : '▶' }}</span>
              </div>

              <div class="ai-dropdown-content" v-show="isAiExpanded">
                  <div class="analysis-text">
                      <template v-if="!fullDramAnalysis && !isFetchingAi">
                          <div class="empty-tip">点击上方“一键生成”按钮，获取专家级剧目解读。</div>
                      </template>
                      <template v-else>
                          {{ fullDramAnalysis }}
                      </template>
                  </div>
              </div>
          </div>
          <h3 class="sidebar-label">晋剧推荐</h3>
          <div class="recommend-scroll">
            <div 
              v-for="item in recommendList" 
              :key="item.id" 
              class="rec-card"
              @click="switchVideo(item.id)"
            >
              <div class="rec-thumb">
                <img :src="item.fullCover" class="rec-img" @error="(e) => e.target.src = DEFAULT_COVER" />
                <div class="play-overlay">▶</div>
              </div>
              <div class="rec-info">
                <h4 class="rec-title">{{ item.title }}</h4>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$gold: #d4a66a;
$bg: #0f0f0f;
$ease: cubic-bezier(0.4, 0, 0.2, 1);

.player-page {
  min-height: 100vh; background: $bg; color: #fff; padding: 20px;
  .content-wrapper { max-width: 1400px; margin: 0 auto; }
}

.player-header {
  display: flex; align-items: center; gap: 20px; margin-bottom: 25px;
  .back-btn {
    background: transparent; border: 1px solid $gold; color: $gold;
    padding: 6px 18px; border-radius: 20px; cursor: pointer; transition: 0.3s;
    &:hover { background: $gold; color: #000; }
  }
  .video-title { font-size: 1.6rem; font-weight: 500; color: $gold; }
}

.layout-body { display: flex; gap: 30px; align-items: flex-start; }
// AI 详细解读模块样式
.ai-detail-section {
  background: rgba($gold, 0.05); // 极浅的金棕色背景
  color: #eee; 
  border: 1px solid rgba($gold, 0.3);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 25px; // 与下方推荐列表拉开距离
  max-height: 250px;
  display: flex;
  flex-direction: column;

  .ai-detail-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: $gold;
    font-weight: bold;
    font-size: 1.9rem;
    margin-bottom: 12px;
    border-bottom: 1px solid rgba($gold, 0.2);
    padding-bottom: 8px;

    .sparkle { font-size: 1.2rem; }
  }

  .ai-detail-content {
    flex: 1;
    overflow-y: auto;
    
    &::-webkit-scrollbar { width: 3px; }
    &::-webkit-scrollbar-thumb { background: rgba($gold, 0.3); }

    .empty-text {
      color: #666;
      font-size: 0.9rem;
      font-style: italic;
      text-align: center;
      margin-top: 20px;
    }

    .ai-log-item {
      margin-bottom: 15px;
      animation: fadeIn 0.5s ease;

      .log-time {
        font-size: 0.75rem;
        color: #555;
        margin-bottom: 4px;
      }
      .log-text {
        font-size: 1.5rem;
        line-height: 1.6;
        color: #ddd;
        // 晋剧特色强调色
        border-left: 2px solid #8b0000; 
        padding-left: 10px;
      }
    }
  }
}
.ai-dropdown-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba($gold, 0.2);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s $ease;
  margin-bottom: 15px;

  &.is-active {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba($gold, 0.5);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }

  .ai-dropdown-header {
    padding: 15px 20px;
    display: flex;
    align-items: center; 
    cursor: pointer;
    user-select: none;
    
    &:hover {
      background: rgba($gold, 0.1);
      .title { color: $gold; }
    }

    // 新增：左侧占位容器
    .header-placeholder {
      flex: 1;
    }

    .header-left {
      flex: 2; // 标题占据中间核心位置
      display: flex;
      justify-content: center; // 标题文字居中
      align-items: center;
      .title { 
        font-weight: bold; 
        font-size: 1.7rem; 
        transition: 0.3s; 
        white-space: nowrap; // 避免标题换行
      }
    }

    // 新增：右侧箭头容器
    .header-arrow-box {
      flex: 1;
      display: flex;
      justify-content: flex-end; // 箭头推向最右侧
      .arrow-icon {
        font-size: 0.8rem;
        color: $gold;
        transition: transform 0.3s;
      }
    }
  }

  .ai-dropdown-content {
    padding: 0 20px 20px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    animation: slideDown 0.4s $ease;
    
    // --- 新增滚动逻辑 ---
    max-height: 400px;        // 设置最大高度，超过此高度出现滚动条
    overflow-y: auto;         // 开启垂直滚动
    scrollbar-gutter: stable; // 避免滚动条出现时页面抖动

    // --- 自定义滚动条样式 (适配深色金边风格) ---
    &::-webkit-scrollbar {
        width: 6px;
    }
    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.02);
        border-radius: 10px;
    }
    &::-webkit-scrollbar-thumb {
        background: rgba($gold, 0.3); // 使用你的金调色
        border-radius: 10px;
        &:hover {
            background: rgba($gold, 0.5);
        }
    }

    .analysis-text {
        font-size: 1.7rem;
        line-height: 1.8;
        color: #ccc;
        white-space: pre-line;
        text-align: justify;
        padding-right: 10px; // 为右侧滚动条留出间距
    }
  }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
// 左侧推荐栏 - 重点优化
.sidebar {
  width: 325px; flex-shrink: 0;
  .sidebar-label { 
    font-size: 1.7rem; 
    color: #eee; 
    margin-bottom: 20px; 
    padding-left: 10px; 
    border-left: 4px solid #8b0000;
  }
  .recommend-scroll {
    display: flex; 
    flex-direction: column; 
    gap: 16px;
    max-height: 85vh; 
    overflow-y: auto; 
    padding-right: 5px;
    &::-webkit-scrollbar { 
      width: 4px; 
    }
    &::-webkit-scrollbar-thumb { 
      background: #333; 
      border-radius: 10px; 
    }
  }
  .rec-card {
    display: flex; gap: 12px; cursor: pointer; padding: 8px;
    border-radius: 10px; transition: 0.3s; background: rgba(255,255,255,0.03);
    &:hover {
      background: rgba(255,255,255,0.08);
      .rec-img { transform: scale(1.1); }
      .play-overlay { opacity: 1; }
    }
    .rec-thumb {
      width: 130px; height: 75px; border-radius: 6px; overflow: hidden;
      position: relative; background: #000; flex-shrink: 0;
      .rec-img {
        width: 100%; height: 100%; object-fit: cover; transition: 0.4s;
      }
      .play-overlay {
        position: absolute; inset: 0; display: flex; align-items: center;
        justify-content: center; background: rgba(0,0,0,0.4);
        color: $gold; font-size: 18px; opacity: 0; transition: 0.3s;
      }
    }
    .rec-info {
      flex: 1; min-width: 0;
      .rec-title { 
        font-size: 1.4rem; 
        margin-bottom: 4px; 
        color: #fff;
        white-space: nowrap; 
        overflow: hidden; 
        text-overflow: ellipsis;
      }
      .rec-desc { font-size: 0.75rem; color: #666; }
    }
  }
}

.main-content {
  flex: 1; min-width: 0;
  .video-container {
    position: relative; background: #000; border-radius: 16px;
    overflow: hidden; aspect-ratio: 16/9; transition: cursor 0.3s;
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
    &.hide-cursor { cursor: none; }
    &:fullscreen { border-radius: 0; }
    .video-el { width: 100%; height: 100%; object-fit: contain; }

    .control-bar {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 25px; background: linear-gradient(transparent, rgba(0,0,0,0.95));
      z-index: 100; transition: transform 0.6s $ease, opacity 0.6s $ease;
      &.is-hidden { transform: translateY(100%); opacity: 0; }
      .progress-wrap {
        padding: 10px 0; cursor: pointer;
        .bar-bg {
          height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px;
          .bar-active { height: 100%; background: $gold; position: relative; }
        }
      }
      .bar-btns {
        display: flex; justify-content: space-between; align-items: center;
        .group { display: flex; align-items: center; gap: 20px; }
        .icon-btn { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; &:hover { color: $gold; } }
        .time-display { font-size: 14px; .cur { color: #fff; } .dur { color: #888; } }
        .mode-btn {
          background: rgba($gold, 0.1); border: 1px solid $gold; color: $gold;
          padding: 6px 18px; border-radius: 20px; cursor: pointer;
          &.active { background: $gold; color: #000; font-weight: bold; }
        }
      }
    }
  }
  .video-details {
    margin-top: 25px; padding: 25px; background: #181818; border-radius: 16px; border-left: 6px solid $gold;
    .video-tag { background: rgba($gold, 0.1); color: $gold; padding: 4px 12px; border-radius: 4px; margin-right: 12px; font-size: 0.8rem; }
    .video-desc { margin-top: 15px; color: #aaa; line-height: 1.8; }
  }
}

/* 优化后的 ai-box 样式 */
.ai-box {
  position: absolute;
  top: 10%; /* 稍微往上提一点，避免遮挡画面中心人物脸部 */
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  max-width: 85%; /* 限制最大宽度，防止横跨整个屏幕 */
  display: flex;
  justify-content: center;
  z-index: 200; /* 确保在所有控件之上 */
  pointer-events: none; /* 防止弹窗遮挡点击视频暂停的操作 */

  .ai-content {
    background: rgba(0, 0, 0, 0.75); /* 改为深色半透明，更具电影感 */
    backdrop-filter: blur(10px);    /* 背景模糊，高级感直升 */
    color: #fff;
    padding: 1.2vw 2.5vw;           /* 使用 vw 单位自适应屏幕大小 */
    border-radius: 12px;            /* 稍微方正一点，更有信息卡片的感觉 */
    border-left: 5px solid $gold;   /* 晋剧特色的金边强调 */
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    
    display: flex;
    align-items: center;
    gap: 15px;

    /* 内部标签优化 */
    .ai-tag {
      background: $gold;
      color: #000;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 900;
      font-size: 0.9rem;
      text-transform: uppercase;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* 文本内容优化 */
    font-size: 1.5rem; /* 基础大字体 */
    line-height: 1.4;
    font-weight: 500;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    letter-spacing: 0.5px;
  }
}

/* --- 核心：全屏状态下的适配方案 --- */
:fullscreen {
  .ai-box {
    top: 12%; 
    .ai-content {
      padding: 2vh 4vh;
      font-size: 3rem;      /* 全屏状态下字体加倍，确保后排也能看清 */
      max-width: 90%;
      border-radius: 20px;
      
      .ai-tag {
        font-size: 1.8rem;  /* 标签同步放大 */
        padding: 8px 20px;
      }
    }
  }
}

/* 针对 Webkit 内核（Chrome/Edge/Safari）的全屏适配 */
.video-container:-webkit-full-screen {
  .ai-box .ai-content {
    font-size: 3rem;
    .ai-tag { font-size: 1.8rem; }
  }
}

/* 动画效果优化 */
.pop-enter-active {
  animation: ai-pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pop-leave-active {
  animation: ai-pop-in 0.4s reverse ease-in;
}

@keyframes ai-pop-in {
  0% { transform: scale(0.5) translateY(-20px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
.pop-enter-active { animation: pop-in 0.5s $ease; }
// @keyframes pop-in { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.loading-state { padding: 100px; text-align: center; color: $gold; font-style: italic; }


.ai-gen-btn {
  margin-left: 12px;
  padding: 4px 12px;
  font-size: 12px;
  background: linear-gradient(135deg, #722ed1, #2f54eb);
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(114, 46, 209, 0.3);
}

.ai-gen-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 10px rgba(114, 46, 209, 0.5);
}

.ai-gen-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
  box-shadow: none;
}

.empty-tip {
  color: #8c8c8c;
  font-style: italic;
  text-align: center;
  padding: 20px 0;
}




</style>
