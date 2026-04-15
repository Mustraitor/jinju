<script setup>
import { ref } from 'vue'
import summaryBg from '@/assets/image/summary_bg-.jpg'

// 点击箭头平滑滚动到下一屏
const scrollToContent = () => {
  // 计算 Header 的实际像素高度 (10vh)
  const headerHeight = window.innerHeight * 0.1; 
  window.scrollTo({
    // 滚动到一屏的高度，减去 Header 占据的高度
    // 这样下面的内容顶端刚好对齐 Header 的底边
    top: window.innerHeight - headerHeight, 
    behavior: 'smooth'
  })
}
</script>

<template>
  <div class="banner" :style="{ backgroundImage: `linear-gradient(to right bottom, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3)), url(${summaryBg})` }">
    <div class="content-wrapper">
      <div class="header-text">{{ $t('banner.slogan') }}</div>
    </div>
    
    <div class="scroll-indicator" @click="scrollToContent">
      <div class="arrow"></div>
    </div>
  </div>
</template>

<style scoped>
.banner { 
  display: flex;
  flex-direction: column;
  /* 核心：占满扣除 Header 后的剩余屏幕 */
  height: 90vh; 
  width: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}

.content-wrapper {
  flex: 1; /* 占据上方所有空间，把箭头挤到最下面 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-text {
  padding: 0 2rem;
  font-size: clamp(2.5rem, 6vw, 5rem);
  color: white;
  text-align: center;
  /* 稍微往上提一点，视觉上更居中（补偿箭头的空间） */
  margin-top: -5vh; 
}

/* 引导箭头容器 */
.scroll-indicator {
  width: 100%;
  height: 10vh; /* 给箭头留出专门的底部空间 */
  display: flex;
  justify-content: center;
  align-items: flex-start; /* 别让箭头贴死最底边 */
  cursor: pointer;
  z-index: 10;
}

.arrow {
  width: 1.5rem;
  height: 1.5rem;
  border-right: 3px solid rgba(255, 255, 255, 0.8);
  border-bottom: 3px solid rgba(255, 255, 255, 0.8);
  transform: rotate(45deg);
  animation: bounce 2s infinite;
}

/* 跳动动画 */
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0) rotate(45deg);
  }
  40% {
    transform: translateY(-15px) rotate(45deg);
  }
  60% {
    transform: translateY(-7px) rotate(45deg);
  }
}

/* 适配不同屏幕高度 */
@media (max-height: 600px) {
  .header-text { font-size: 2rem; }
  .banner { height: auto; min-height: 90vh; }
}
</style>