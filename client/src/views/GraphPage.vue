<template>
  <div class="layout-wrapper">
      <Header />
      <div class="app-container" :class="{ collapsed: isCollapsed }">

      <!-- 侧边栏 -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <div class="logo-box">
              <h1>晋剧知识图谱</h1>
            </div>
            <div class="collapse-btn" @click="toggleSidebar">
              <i v-if="!isCollapsed">⟨</i>
              <i v-else>⟩</i>
            </div>
          </div>
          <div class="search-area" v-show="!isCollapsed">
            <div class="search-wrapper">
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="快速搜索剧目..."
                @input="handleSearch"
              />
              <!-- <span class="search-icon">🔍</span> -->
            </div>
          </div>
          <nav class="play-nav">
            <ul class="play-list">
              <li 
                v-for="item in filteredPlayList" 
                :key="item.id" 
                :class="{ active: currentPlayId === item.id }"
                @click="changePlay(item.id)"
              >
                <div class="active-indicator"></div>
                <span class="play-name">{{ item.name }}</span>
                <i class="arrow-icon"></i>
              </li>
            </ul>
          </nav>

        </aside>

        <main class="main-content">
          <div class="graph-wrapper" ref="chartRef"></div>
          
          <transition name="fade-slide">
            <div class="content-header" :key="currentPlayId">
              <div class="title-block">
                <span class="subtitle">SHANXI OPERA</span>
                <h2 class="main-title">{{ currentPlayName }}</h2>
              </div>
              <div class="decoration-line"></div>
            </div>
          </transition>
        </main>
        <!-- 右侧弹出抽屉 -->
        <transition name="slide-left">
          <div class="right-drawer" v-show="showDrawer">
            <div class="drawer-header">
              <h3>{{ drawerData.title }}</h3>
              <button class="close-btn" @click="showDrawer = false">×</button>
            </div>

            <div class="drawer-content">

              <!-- 剧目 -->
              <div v-if="drawerData.type === 'play'">
                <p><strong>别名：</strong>{{ drawerData.detail.alias }}</p>
                <p><strong>剧情简介：</strong>{{ drawerData.detail.description }}</p>

                <h4>🎬 视频资源</h4>
                <ul>
                  <li v-for="v in drawerData.videos" :key="v.id">
                    <a :href="v.url" target="_blank">{{ v.title }}</a>
                  </li>
                </ul>
              </div>

              <!-- 角色 -->
              <div v-if="drawerData.type === 'role'">
                <p><strong>行当：</strong>{{ drawerData.detail.role_type }}</p>
                <p><strong>角色描述：</strong>{{ drawerData.detail.description }}</p>

    
              </div>

              <!-- 演员 -->
              <div v-if="drawerData.type === 'actor'">
                <img v-if="drawerData.detail.avatar" :src="drawerData.detail.avatar" class="actor-avatar" />
                <p><strong>简介：</strong>{{ drawerData.detail.bio }}</p>
                <p><strong>出生年份：</strong>{{ drawerData.detail.birth_year }}</p>
                <p><strong>去世年份：</strong>{{ drawerData.detail.death_year }}</p>
              </div>

              <!-- 行当 -->
              <div v-if="drawerData.type === 'hd'">
                <p><strong>行当分类：</strong>{{ drawerData.title }}</p>
              </div>

            </div>

          </div>
        </transition>

      </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive } from "vue";
import * as echarts from "echarts";
import fetchWrapper from "@/utils/fetchWrapper";
import Header from "@/components/header.vue";
const playList = ref()
const RELATION_MAP = {
  'has_role': '包含角色',
  'has_actor': '饰演',
  'has_version': '对应版本',
  'plays': '出演',
  'belongs_to': '属于',
  'husband_wife':'夫妻'
};
const chartRef = ref(null);
let myChart = null;

// ⭐ 新增：折叠状态
const isCollapsed = ref(false);
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

const currentPlayId = ref(1);
const currentPlayName = ref("打金枝");

// 主题配色变量 (与 SCSS 保持同步)
const THEME = { 
  primary: '#8e2323',
  secondary: '#d1d1d1',
  bg: '#fdfbf8',
  text: '#333333'
};

const showDrawer = ref(false);
const drawerData = reactive({
  type: '',      // play | role | actor | video | hangdang
  title: '',
  detail: {},    // 详细信息
  videos: []     // 只有角色/剧目才会有
});


async function handleNodeClick(nodeId) {
  // 1. 解析 ID。假设传入的是 "role_12"
  const [type, id] = nodeId.split("_"); 

  drawerData.type = type;

  try {
    if (type === "role") {
      const res = await fetchWrapper(`/graph/node/role/${id}`); 
      drawerData.title = res.data.role_name; // 角色表里通常叫 role_name
      drawerData.detail = res.data;
      drawerData.videos = res.data.videos || [];

    } else if (type === "actor") {
      const res = await fetchWrapper(`/graph/node/actor/${id}`); 
      drawerData.title = res.data.name;
      drawerData.detail = res.data;

    } else if (type === "play") {
      const res = await fetchWrapper(`/graph/node/play/${id}`);
      drawerData.title = res.data.name;
      drawerData.detail = res.data;
      drawerData.videos = res.data.videos || [];

    } else if (type === "hd") {

      drawerData.title = id; 
      drawerData.detail = { type: id };
    }

    showDrawer.value = true;

  } catch (error) {
    console.error("获取节点详情失败:", error);
    // 这里可以加一个消息提示，比如 message.error("无法加载详情");
  }
}


const initChart = async (id) => {
  if (!myChart) {
    myChart = echarts.init(chartRef.value);
  }
  
  myChart.showLoading({ 
    text: '正在翻阅卷宗...', 
    color: THEME.primary,
    textColor: THEME.text,
    maskColor: 'rgba(253, 251, 248, 0.8)'
  });






  
  try {
    const res = await fetchWrapper(`/graph/play/${id}`);
    const { nodes, links } = res.data;
    const processedLinks = links.map(link => {
    // 核心逻辑：如果在 map 里找到了中文就用中文，找不到就显示原始英文（兜底策略）
    const chineseName = RELATION_MAP[link.name] || link.name; 





    return {
        source: link.source,
        target: link.target,
        name: chineseName, // 这样 tooltip 和 edgeLabel 拿到的就是中文了
        label: {
        show: true,
        formatter: chineseName
        },
        lineStyle: { 
        color: '#ddd', 
        curveness: 0.1, 
        width: 1.5 
        }
    };
    });
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: THEME.primary,
        textStyle: { color: '#333' },
        formatter: (p) => p.dataType === 'node' ? `${p.name}` : ''
      },
      legend: {
        bottom: 30,
        itemGap: 25,
        textStyle: { color: '#666', fontSize: 14 }
      },
      series: [{
        type: 'graph',
        layout: 'force',
        edgeLabel: {
            show: true,
            formatter: (p) => p.data.name || '',
            fontSize: 10,
            color: '#1a1a1a'
        },
        animation: false,
        animationDuration: 1500,
        animationEasingUpdate: 'quinticInOut',
        roam: true,
        draggable: true,
        selectedMode: 'single',
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 5, color: THEME.primary }
        },
        label: {
          show: true,
          position: 'right',
          distance: 5,
          fontSize: 13,
          color: '#444'
        },
        categories: [
          { name: "剧目", itemStyle: { color: THEME.primary }, symbolSize: 65 },
          { name: "角色", itemStyle: { color: '#2c2c2c' }, symbolSize: 35 },
          { name: "演员", itemStyle: { color: '#e6a23c' }, symbolSize: 30 },
          { name: "行当", itemStyle: { color: '#5470c6' }, symbolSize: 45 },
        ],
        force: {
          repulsion: 1200,
          gravity: 0.05,
          edgeLength: [120, 200],
          layoutAnimation: true
        },
        data: nodes.map(node => ({
            id: node.id, 
            name: node.name,
            category: node.category
        })),
        links: processedLinks,
        symbolSize: 7,
      }]
    };

    myChart.setOption(option);



myChart.off('click'); 
myChart.on('click', (params) => {
  // 【关键修复】：加上 dataType 判断，防止点击到“连线”上也触发抽屉
  if (params.dataType === 'node') {
    const nodeId = params.data.id;  
    handleNodeClick(nodeId);
  }
});
  } catch (err) {
    console.error(err);
  } finally {
    myChart.hideLoading();
  }
};

const searchQuery = ref(""); // 搜索关键字

// ⭐ 核心逻辑：计算属性过滤
const filteredPlayList = computed(() => {
  if (!playList.value) return [];
  if (!searchQuery.value) return playList.value;
  
  return playList.value.filter(item => 
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const changePlay = (id) => {
  // 从原始完整列表中找到对应的剧目对象
  const selectedPlay = playList.value.find(p => p.id === id);
  
  if (selectedPlay) {
    currentPlayId.value = id;
    currentPlayName.value = selectedPlay.name;
    initChart(id);
  }
};


onMounted(async () => {
  initChart(currentPlayId.value);
  const res = await fetchWrapper('/graph/play/list');
  // console.log(res);
  // console.log(res.data);
  playList.value = res.data;
  window.addEventListener('resize', () => myChart?.resize());
});

onUnmounted(() => {
  window.removeEventListener('resize', () => myChart?.resize());
  myChart?.dispose();
});


</script>

<style lang="scss" scoped>
$primary-color: #8e2323;
$sidebar-bg: #1a1a1a;
$sidebar-hover: #262626;
$paper-bg: #fdfbf8;
$transition-base: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
.layout-wrapper {
  display: flex;
  flex-direction: column; /* 让 Header 和 Container 上下排列 */
  height: 100vh;          /* 整个窗口高度 */
  overflow: hidden;       /* 禁止整页滚动 */
}
.app-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  background-color: $paper-bg;
  overflow: hidden;

  .sidebar {
    width: 280px;
    height: 100%;
    background-color: $sidebar-bg;
    display: flex;
    flex-direction: column;
    box-shadow: 4px 0 15px rgba(0, 0, 0, 0.3);
    border-right: 4px solid $primary-color;
    transition: $transition-base;
    position: relative;

    .sidebar-header {
      padding: 40px 20px;
      position: relative;
      .logo-box {
        text-align: center;
        h1 {
          color: #fff;
          font-size: 2.5rem;
          letter-spacing: 4px;
        }
      }
    }

    /* ⭐ 新增：折叠按钮 */
    .collapse-btn {
      position: absolute;
      top: 20px;
      right: -15px;
      width: 30px;
      height: 30px;
      background: #1a1a1a;
      border: 2px solid $primary-color;
      border-radius: 50%;
      color: #fff;
      cursor: pointer;
      @include flex-center;
      transition: $transition-base;
      z-index: 20;

      &:hover {
        background: $primary-color;
      }
    }
    .search-area {
      padding: 0 20px 15px 20px;

      .search-wrapper {
        position: relative;
        input {
          width: 100%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 10px 12px 10px 35px; // 左边留出图标位置
          color: #fff;
          font-size: 14px;
          transition: all 0.3s;

          &:focus {
            outline: none;
            border-color: $primary-color;
            background: rgba(255, 255, 255, 0.12);
            box-shadow: 0 0 8px rgba($primary-color, 0.4);
          }

          &::placeholder {
            color: #666;
          }
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          opacity: 0.5;
        }
      }
    }

    .no-results {
      text-align: center;
      color: #555;
      padding: 20px;
      font-size: 13px;
    }

    // 侧边栏折叠时隐藏搜索框
    .app-container.collapsed {
      .search-area {
        display: none;
      }
    }

    .play-nav {
      flex: 1;
      padding-top: 20px;
      overflow-y: auto; 
      overflow-x: hidden;
      &::-webkit-scrollbar {
        width: 4px; // 滚动条宽度
      }
      
      &::-webkit-scrollbar-thumb {
        background: rgba($primary-color, 0.3); // 滚动条滑块颜色
        border-radius: 10px;
        
        &:hover {
          background: $primary-color; // 悬停时变深
        }
      }

      &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1); // 滚动条轨道颜色
      }
      .play-list {
        list-style: none;
        padding: 0;

        li {
          position: relative;
          padding: 20px 30px;
          cursor: pointer;
          color: #aaa;
          transition: $transition-base;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);

          .active-indicator {
            position: absolute;
            left: 0;
            width: 0;
            height: 100%;
            background-color: $primary-color;
            transition: $transition-base;
          }

          .play-name {
            font-size: 16px;
            letter-spacing: 2px;
            z-index: 2;
          }

          &:hover {
            background-color: $sidebar-hover;
            color: #fff;
            padding-left: 40px;
          }

          &.active {
            background-color: rgba($primary-color, 0.1);
            color: #fff;
            .active-indicator {
              width: 6px;
            }
            .play-name {
              font-weight: bold;
              color: $primary-color;
            }
          }
        }
      }
    }
  }

  /* ⭐ 新增：折叠样式 */
  &.collapsed {
    .sidebar {
      width: 60px;

      .sidebar-header {
        padding: 40px 10px;

        h1 {
          display: none;
        }
      }

      .play-nav {
        .play-list li {
          padding-left: 20px;

          .play-name {
            display: none;
          }
        }
      }
    }
  }

  .main-content {
    flex: 1;
    position: relative;
    background-image: 
      linear-gradient(rgba(230, 230, 230, 0.3) 1px, transparent 1px),
      linear-gradient(90deg, rgba(230, 230, 230, 0.3) 1px, transparent 1px);
    background-size: 40px 40px;

    .graph-wrapper {
      width: 100%;
      height: 100%;
    }

    .content-header {
      position: absolute;
      top: 50px;
      left: 60px;
    }
  }
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.5s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(30px);
}





// 定义晋剧主题色变量
$theme-red: #8e2323;
$bg-light: #fdf2f2;
$text-main: #333;
$transition-base: all 0.3s ease;

.right-drawer {
  position: fixed;
  top: 70px;
  right: 0;
  width: 420px; // 略微增加宽度，方便文字排版
  height: calc(100vh - 70px);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-left: 5px solid $theme-red;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  text-align: left; // 强制内容左对齐

  // 头部样式
  .drawer-header {
    padding: 24px;
    background: $theme-red;
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 22px; // 增大标题
      letter-spacing: 1px;
      font-weight: bold;
    }

    .close-btn {
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      width: 32px;
      height: 32px;
      line-height: 28px;
      border-radius: 50%;
      transition: $transition-base;

      &:hover {
        background: #fff;
        color: $theme-red;
      }
    }
  }

  // 内容主体
  .drawer-content {
    padding: 30px 24px;
    overflow-y: auto;
    flex: 1;
    color: $text-main;
    line-height: 1.8;
    font-size: 16px; // 基础字号加大

    // 针对不同类型的块进行修饰
    div {
      margin-bottom: 20px;
    }

    p {
      margin-bottom: 15px;
      text-align: left; // 确保段落左对齐

      strong {
        color: $theme-red;
        background: $bg-light;
        padding: 4px 10px;
        border-radius: 4px;
        margin-right: 10px;
        font-size: 15px;
        font-weight: 600;
        display: inline-block; // 方便控制间距
      }
    }

    h4 {
      border-left: 4px solid $theme-red;
      padding-left: 12px;
      margin: 30px 0 15px;
      color: $theme-red;
      font-size: 18px;
      text-align: left;
    }
  }

  // 演员头像特化处理（左对齐）
  .actor-avatar {
    width: 140px;
    height: 140px;
    display: block;
    margin: 0 0 20px 0; // 这里的 0 0 20px 0 确保其不居中，而是左对齐
    border-radius: 8px; // 尝试方圆结合，更有现代感
    border: 2px solid $theme-red;
    object-fit: cover;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  // 视频列表
  .video-list-ul {
    list-style: none;
    padding: 0;

    .video-item {
      margin-bottom: 12px;
      background: #fdfdfd;
      border: 1px solid #eee;
      border-radius: 8px;
      transition: $transition-base;

      &:hover {
        background: $bg-light;
        border-color: $theme-red;
        transform: translateX(8px);
      }

      a {
        display: block;
        padding: 15px;
        color: #444;
        text-decoration: none;
        font-size: 15px;
        font-weight: 500;
        
        span {
          margin-right: 8px;
        }
      }
    }
  }
}

</style>
