<script setup>
import fetchWrapper from "@/utils/fetchWrapper";
import { onMounted, ref } from "vue";
import { useRouter } from 'vue-router'
const videoList = ref([]);
// 获取环境变量或硬编码后端地址
const BASE_URL = import.meta.env.VITE_APP_API_URL.replace(/\/$/, '')

onMounted(async() => {
  const res = await fetchWrapper('/video/list');
  console.log(res);
  
  if (res && res.code === 0) {
    // 对数据进行预处理，拼接完整的封面地址
    console.log(res.data);
    
    videoList.value = res.data.map(item => {
      let fullCover = '/assets/image/default-cover.jpg';
      
      if (item.cover) {
        // 拆分路径，只针对文件名进行编码
        const pathParts = item.cover.split('/');
        const fileName = pathParts.pop();
        const folder = pathParts.join('/');
        

        const encodedFileName = encodeURIComponent(fileName);
        
        fullCover = item.cover.startsWith('http') 
          ? item.cover 
          : `${BASE_URL}${folder}/${encodedFileName}`;
        console.log(fullCover);
        
      }

      return {
        ...item,
        fullCover: fullCover
      };
    });
  }
});

const openVideo = (id) => {
  window.open(`/player/${id}`, "_blank");
};

const router = useRouter()
const toHome = () => {
    router.push('/home')
}
</script>
<template>
  <div class="home-page">
    <h1 class="title" @click="toHome">晋剧精选视频</h1>
    <div class="video-grid">
      <div
        class="video-card"
        v-for="item in videoList"
        :key="item.id"
        @click="openVideo(item.id)"
      >
        <div class="cover-box">
          <img :src="item.fullCover" class="cover" />
        </div>

        <div class="info">
          <div class="name">{{ item.title }}</div>
          <div class="desc">{{ item.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 背景带传统纹理感（柔和云纹） */
.home-page {
  padding: 20px;
  min-height: 100vh; 
  background: linear-gradient(
      rgba(255, 250, 240, 0.6),
      rgba(255, 250, 240, 0.7)
    ), 
    url("https://img2.baidu.com/it/u=1269664,1133874680&fm=253&fmt=auto&app=120&f=JPEG?w=1200&h=800");
  background-size: cover;
  background-attachment: fixed;
}

/* 标题采用戏曲海报风格 */
.title {
  font-size: 2.4rem;
  font-weight: 800;
  margin-bottom: 25px;
  text-align: left;
  color: #a60000;
  letter-spacing: 2px;
  border-left: 6px solid #d4a66a;
  padding-left: 12px;
}

/* 视频卡片布局调整 */
.video-grid {
  display: grid;
  /* 核心修改：使用 repeat(4, 1fr) 强制一行四个 */
  grid-template-columns: repeat(4, 1fr); 
  /* 调整间距：20px 可以根据视觉感微调 */
  gap: 20px; 
  /* 确保整体容器居中且有最大宽度限制（可选，防止超大屏太散） */
  max-width: 1400px;
  margin: 0 auto;
}

/* 响应式适配：如果屏幕太小，强制 4 列会导致卡片太挤 */
@media (max-width: 1200px) {
  .video-grid {
    grid-template-columns: repeat(3, 1fr); /* 中等屏幕 3 列 */
  }
}

@media (max-width: 900px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr); /* 平板 2 列 */
  }
}

@media (max-width: 600px) {
  .video-grid {
    grid-template-columns: 1fr; /* 手机 1 列 */
    gap: 16px;
  }
}

/* 封面高度微调，适配 4 列下的比例 */
.cover-box {
  width: 100%;
  /* 建议使用 aspect-ratio 替代固定高度，这样图片比例更协调 */
  aspect-ratio: 16 / 9; 
  height: auto; 
  overflow: hidden;
  position: relative;
}

/* 卡片增加传统色调 + 金色外发光 */
.video-card {
  cursor: pointer;
  background: #fff7f0;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e6d3b3;
  box-shadow: 0 5px 15px rgba(150, 50, 50, 0.1);
  transition: all 0.3s ease;
}

.video-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(120, 30, 30, 0.25);
  border-color: #caa065;
}

/* 封面区域 */
.cover-box {
  width: 100%;
  height: 170px;
  overflow: hidden;
  position: relative;
}

/* 封面添加戏曲光影效果 */
.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: 0.35s;
  filter: brightness(0.96);
}

.video-card:hover .cover {
  transform: scale(1.08);
  filter: brightness(1.05);
}

/* 信息区域 */
.info {
  padding: 14px;
}

/* 视频标题 */
.name {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 6px;
  color: #8b0000;
}

/* 简介 */
.desc {
  font-size: 0.95rem;
  color: #5b4a4a;
  line-height: 1.4;
}
</style>
