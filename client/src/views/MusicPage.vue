<script setup>
import fetchWrapper from '@/utils/fetchWrapper.js'
import { onMounted, ref, onUnmounted} from 'vue'
import { formatSeconds } from '@/utils/formatSeconds.js'
import Header from '@/components/header.vue'

const audioInfo = ref()
const selectedId = ref()
const currentAudio = ref()
const duration_raw = ref(null)
const duration = ref(null)
const currentTime = ref('00:00')
const loop = ref(false)
const isPlay = ref(false) // 在顶部添加这行

onMounted(async () => {
    //获取音频文件的信息
    const response = await fetchWrapper('/music/getMusicInfo', { method: 'GET' })
    audioInfo.value = response.data

})
// console.log(audioInfo.value );
onUnmounted(() => {
    deleteAudio()
});
//创建音频对象
const createAudio = async (item) => {
        const encodedFilename = encodeURIComponent(item.filename);
        currentAudio.value = new Audio(`${import.meta.env.VITE_APP_API_URL}/audio/${encodedFilename}`)
        currentAudio.value.play()
        currentAudio.value.volume = 0.7
        duration_raw.value = item.duration
        duration.value = formatSeconds(item.duration) 
        currentAudio.value.addEventListener('timeupdate', () => {
            updateProgress()
        })
        currentAudio.value.addEventListener('ended', async() => {
            // console.log('success');
            let index = audioInfo.value.findIndex(item => item.id === selectedId.value )
            index = (index + 1) % audioInfo.value.length
            toggleAudio(audioInfo.value[index])

        })

}
//删除音频对象
const deleteAudio = () => {
    if (currentAudio.value) {
        currentAudio.value.pause();
        currentAudio.value= null;
    }
}

//切换音频(playlist)
const toggleAudio = async (item) => {
    try {
        // //判断是否为同一个音频
        // console.log(item.id, selectedId.value);
        if(item.id === selectedId.value){
            return
        }
        isPlay.value = true
        selectedId.value = item.id
        deleteAudio()
        await createAudio(item)
        scrollIntoitem()
        // 设置音频播放模式（单曲循环/列表播放）
        if(loop.value){
            currentAudio.value.loop =  true
        }else{
            currentAudio.value.loop =  false
        }

    } catch (error) {
        console.error('播放失败:', error)
    }
}

//播放/暂停音频 (player)
const playAudio = async() => {
    isPlay.value = !isPlay.value
    if(isPlay.value){
        currentAudio.value.play()
    }else {
        currentAudio.value.pause()
    }
    scrollIntoitem()
}

// 存储音频DOM
const itemRefs = ref({})
const handleScroll = (el, id) => {
  if (el) {
    itemRefs.value[id] = el
  }
//   console.log(itemRefs.value);
  
}
//正在播放的音频居中
const scrollIntoitem = () => {
    const element = itemRefs.value[selectedId.value];
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    })
}
//上一首
const prev = () => {
    let index = audioInfo.value.findIndex(item => item.id === selectedId.value )
    index = (index - 1 + audioInfo.value.length) % audioInfo.value.length
    toggleAudio(audioInfo.value[index])
}
//下一首
const next = () => {
    let index = audioInfo.value.findIndex(item => item.id === selectedId.value )
    index = (index + 1) % audioInfo.value.length
    toggleAudio(audioInfo.value[index])
    
    
}
// 音量处理
const mute = ref(false)
const handleVolume = () => {
    mute.value = !mute.value
    if(mute.value){
        currentAudio.value.volume = 0  
    }else {
        currentAudio.value.volume = 0.7
    }

}

const progressPercentage = ref(0)
const progress = ref(null)
const progress_item = ref(null)
const updateProgress = () => {
  if (currentAudio.value && duration.value) {
    // 计算进度条百分比
        progressPercentage.value = (currentAudio.value.currentTime / duration_raw.value) * 100;  
  }
  //更新当前时间
  currentTime.value = formatSeconds(currentAudio.value.currentTime);

  
}
//设置进度条跳转
const setProgress = (event) => {
    if (!currentAudio.value || !duration.value) return;
    const rect = progress.value.getBoundingClientRect()
    const clickPosition = event.clientX - rect.left;
    const progressWidth = rect.width;
    progressPercentage.value = Math.min(100, Math.max(0, (clickPosition / progressWidth) * 100));
    const newTime = (progressPercentage.value / 100) * duration_raw.value;
    currentAudio.value.currentTime = newTime;
    if(isPlay.value){
        currentAudio.value.play()
    }
}

const modeChange = () => {
    loop.value = !loop.value
    if(loop.value){
        currentAudio.value.loop =  true
    }else{
        currentAudio.value.loop =  false
    }

}

</script>
<template>
  <div class="jinju-bg"></div>
  <Header />

  <div id="container">
    <div id="music">
      <!-- 播放列表 -->
      <div class="playlist" ref="playlist">
        <div class="title">晋韵戏曲 · 典藏曲库</div>

        <el-scrollbar class="scrollbar">
          <li
            v-for="item in audioInfo"
            @click="toggleAudio(item)"
            :key="item.id"
            :class="{ 'audioStyle': selectedId === item.id }"
            :ref="el => handleScroll(el, item.id)"
            class="scrollbar_item"
          >
            <span class="music-name">{{ item.filename }}</span>
          </li>
        </el-scrollbar>
      </div>

      <!-- 播放器部分 -->
      <div class="player">
        <div class="item1">
          <div class="currentTime">{{ currentTime }}</div>

          <div class="progress" ref="progress" @click="setProgress">
            <div
              class="progress_item"
              ref="progress_item"
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>

          <div class="duration">{{ duration }}</div>
        </div>

        <div class="item2">
          <div class="player_volume" @click="handleVolume">
            <img v-if="!mute" src="../assets/image/icon_volume.svg" alt="#">
            <img v-if="mute" src="../assets/image/icon_mute.svg" alt="#">
          </div>

          <div class="player_previous" @click="prev">
            <img src="../assets/image/icon_prev.svg" alt="#">
          </div>

          <div :class="{ player_pause: isPlay, player_play: !isPlay }" @click="playAudio">
            <img v-if="isPlay" src="../assets/image/icon_pause.svg" alt="#">
            <img v-if="!isPlay" src="../assets/image/icon_play.svg" alt="#">
          </div>

          <div class="player_next" @click="next">
            <img src="../assets/image/icon_next.svg" alt="#">
          </div>

          <div class="mode" @click="modeChange">
            <img v-if="!loop" src="../assets/image/list_play.svg" alt="#" class="list">
            <img v-if="loop" src="../assets/image/loop_play.svg" alt="#" class="loop">
          </div>
        </div>
      </div>
    </div>

    <div id="music_info"></div>
  </div>
</template>



<style scoped lang="scss">
.jinju-bg {
  position: fixed;
  width: 100%;
  height: 100vh;
  background: url("../assets/image/jinju_bg_paper.jpg") center/cover no-repeat;
  filter: brightness(0.92);
  z-index: -100;
}

#container {
  display: flex;
  justify-content: center;
}

/* 主音乐卡片 */
#music {
  display: flex;
  flex-direction: column;
  height: 82vh;
  width: 480px;
  background: url('../assets/image/jinju_red_pattern.png');
  border: 4px solid #a33a31;
  border-radius: 18px;
  padding-bottom: 1rem;
  margin-top: 2rem;
  box-shadow: 0 0 25px rgba(80, 38, 20, 0.35);
}

/* 播放列表 */
.playlist {
  height: 65%;
  color: #4b1e12;

  .title {
    padding: 1.6rem 0;
    font-size: 28px;
    font-weight: 600;
    letter-spacing: 2px;
    color: #a33a31;
    background: url('../assets/image/jinju_title_bg.png') center/contain no-repeat;
  }

  li {
    padding: 1.6rem 0;
    cursor: pointer;
    transition: 0.25s;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.1);

    .music-name {
      font-size: 20px;
      font-weight: 500;
    }
  }

  li:hover {
    background-color: rgba(215, 145, 90, 0.35);
    color: #5c2a17;
  }
}

/* 正在播放条目 */
.audioStyle {
  background-color: #c95d3d !important;
  color: white !important;
  font-weight: bold;
}

/* 播放器主体 */
.player {
  height: 35%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  padding: 1rem;

  .item1 {
    display: flex;
    justify-content: space-between;
    padding: 0 1.5rem;
    align-items: center;
  }

  .progress {
    height: 10px;
    width: 260px;
    background: #f2e4d5;
    border-radius: 10px;
    position: relative;
    cursor: pointer;

    &_item {
      height: 100%;
      background: #a33a31;
      border-radius: 10px;
      transition: 0.2s;
    }
  }

  .item2 {
    display: flex;
    justify-content: space-around;
    align-items: center;

    div {
      width: 48px;
      height: 48px;
    }
  }
}
.currentTime,
.duration {
  font-size: 22px;      /* 字体变大 */
  font-weight: 600;     /* 半粗体，更清晰 */
  color: #7a2f22;       /* 深红褐色，配合整个主题 */
  min-width: 60px;      /* 防止时间跳动导致布局抖动 */
  text-align: center;   /* 居中更美观 */
}


</style>