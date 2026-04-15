<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { chatApi } from '@/api/chat.js'
import * as PIXI from 'pixi.js'
import { Live2DModel, SoundManager } from 'pixi-live2d-display/cubism4'
import { debounce } from '@/utils/debounce.js'
import Dialog from '@/components/dialog.vue'
import SaveData from '@/components/saveData.vue'
import LoadData from '@/components/loadData.vue'
import { buttonSound } from '@/utils/buttonClick.js'
import { typeWriter } from '@/utils/typeWriter.js'
import { cleanText } from '@/utils/cleanText.js'
import { localTime } from '@/utils/timeTransform.js'
import { useRouter } from 'vue-router'
import { usechatAIstore } from '@/stores/chatAI.js'
import fetchWrapper from '@/utils/fetchWrapper'

const chatAIstore = usechatAIstore()
const { conversation_id } = storeToRefs(chatAIstore)
SoundManager.volume = 20;
window.PIXI = PIXI;
const liveCanvas = ref(null);


let app = null;
let model = null;
let audioContext = null;
let analyser = null;
let dataArray = null;
let resizeHandler = null

const audioInstance = new Audio();
audioInstance.crossOrigin = "anonymous";
let audioSourceNode = null;

onMounted(async () => {

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  app = new PIXI.Application({
    view: liveCanvas.value,
    autoStart: true,
    resizeTo: liveCanvas.value,
    backgroundAlpha: 0,
  });


  // model = await Live2DModel.from("Eustia/尤斯蒂娅.model3.json", {
  //   idleMotionGroup: null,  // 彻底关闭 idle
  //   autoInteract: false,
  // });
  model = await Live2DModel.from("hiyori/hiyori_free_t08.model3.json", {
    idleMotionGroup: null,  // 彻底关闭 idle
    autoInteract: false,
  }); 

  console.log("模型加载成功");

  model.anchor.set(0.5);
  model.scale.set(0.25);
  app.stage.addChild(model);
  model.internalModel.motionManager.groups.idle = []
  //居中
  centerModel();
  resizeHandler = debounce(centerModel);
  window.addEventListener("resize", resizeHandler);
  await chatAIstore.createConversation();
  await chatApi.initData();

  app.ticker.add(() => {
      animateLipSync();
  });
}); 



// 3. 优化后的初始化音频系统 (只连一次)
const initAudioSystem = async () => {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') await audioContext.resume();

    if (!analyser) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    }

    if (!audioSourceNode) {
        audioSourceNode = audioContext.createMediaElementSource(audioInstance);
        audioSourceNode.connect(analyser);
        analyser.connect(audioContext.destination);
    }
};
// --- 调整后的全局参数 ---
let mouth = 0;
let gate = 0.05;       
let maxEnergy = 0.15;  

const CONFIG = {
  attack: 0.8,       
  release: 0.5,      
  jitterSpeed: 50,   
  jitterAmp: 0.5,    
  eyeSpeed: 10,      
};

function animateLipSync() {
  requestAnimationFrame(animateLipSync);
  if (!model || !analyser) return;

  const now = Date.now();
  const t = now / 1000;


  const breath = (Math.sin(t * 1.5) + 1) / 2;
  model.internalModel.coreModel.setParameterValueById("ParamBreath", breath);


  if (!loading.value) {

    mouth *= 0.7; 
    
    if (mouth < 0.01) {
        mouth = 0;
        model.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", 0);
        model.internalModel.coreModel.setParameterValueById("ParamMouthForm", 0);
        return; 
    }

    model.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", mouth);
    return;
  }
  analyser.getByteFrequencyData(dataArray);
  let sum = 0;
  for (let i = 5; i < 40; i++) sum += dataArray[i];
  let energy = (sum / 35 / 255) / maxEnergy; 
  if (energy > 1.2) energy = 1.2;            
  if (energy < gate) energy = 0;           
  if (energy > 0.1) energy += (Math.random() - 0.5) * 0.15;
  const delta = energy - mouth;
  mouth += delta * (delta > 0 ? CONFIG.attack : CONFIG.release);
  model.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", mouth);
  const damping = Math.min(mouth * 8, 1); 
  const formOscillation = Math.sin(now / CONFIG.jitterSpeed) * CONFIG.jitterAmp;
  const targetForm = (formOscillation * damping) + (mouth * 0.5);
  model.internalModel.coreModel.setParameterValueById("ParamMouthForm", targetForm);
  const eyeX = Math.sin(t * CONFIG.eyeSpeed) * 0.15 * damping;
  const eyeY = Math.cos(t * CONFIG.eyeSpeed) * 0.15 * damping;
  model.internalModel.coreModel.setParameterValueById("ParamEyeBallX", eyeX);
  model.internalModel.coreModel.setParameterValueById("ParamEyeBallY", eyeY);
}


  // model.motion("Idle", 0) // 01
  // model.motion("Idle", 1) // 02
  // model.motion("Idle", 2) // 05
  // model.motion("Flick", 0) // 03
  // model.motion("FlickDown", 0) // 04
  // model.motion("Tap", 0) //06
  // model.motion("Tap@Body", 0) //07
  // model.motion("Flick@Body", 0) //08
  // model.motion("mouthOpen", 0)


  // 居中
  // centerModel();
  // resizeHandler = debounce(centerModel);
  // window.addEventListener("resize", resizeHandler);

  // // 你原来的初始化
  // await chatAIstore.createConversation();
  // await chatApi.initData();

// --- 业务逻辑 ---
const message = ref('')
const inputValue = ref('')
const loading = ref(false)
const AImessage = ref('')
const textList = ref([])
const showTextbox = ref(null)
let id = 0;

const sendMessage = async () => {
  if(inputValue.value && !loading.value){
    message.value = inputValue.value;
    inputValue.value = '';
    loading.value = true; // 开始加载/说话
    await addlist();
  }
}

const addlist = async () => {
  const Usermessage = message.value;
  const chatAI = await chatApi.sendChatMessage(Usermessage, conversation_id.value);
  AImessage.value = cleanText(chatAI.data.answer);
  
  textList.value.push({
    id: ++id,
    user: Usermessage,
    AI: AImessage.value
  });
  
  showTextbox.value.style.display = 'block';
  typeWriter(AImessage.value, showTextbox.value, 150);
  // await TTS(AImessage.value);
}

const TTS = async (text) => {
  try {
      const response = await chatApi.textToSpeech(text);
      // 1. 处理 BaseURL：去掉末尾的斜杠
    const baseUrl = import.meta.env.VITE_APP_API_URL.replace(/\/$/, '');
    
    // 2. 处理 FilePath：确保开头有一个斜杠
    const filePath = response.filePath.startsWith('/') 
                     ? response.filePath 
                     : `/${response.filePath}`;

    const audioPath = `${baseUrl}${filePath}`;
  
      audioInstance.src = audioPath;
      audioInstance.onplay = () => { loading.value = true; };
      audioInstance.onended = () => { loading.value = false; };
      audioInstance.onerror = (e) => { 
          console.error("音频播放错", e); 
          loading.value = false; 
      };

      await initAudioSystem();
      await audioInstance.play();
      
      saveTTS(response.filePath);
  } catch (e) {
      console.error("TTS Error", e);
      loading.value = false;
  }
}

const centerModel = () => {
  if (!app || !model) return;
  model.position.set(app.screen.width / 2, app.screen.height * 0.66);
};

onBeforeUnmount(() => {
  if (resizeHandler) window.removeEventListener("resize", resizeHandler);
  if (audioContext) audioContext.close(); // 彻底关闭音频上下文
  app?.destroy(true, { children: true, texture: true, baseTexture: true });
  model = null;
});

const router = useRouter();
const toHome = () => router.push("/home");
const isLog = ref(false);
const handleLog = () => { isLog.value = !isLog.value; buttonSound(); };
const audioUrl = ref([]);
const saveTTS = (url) => audioUrl.value.push(url);
const isSave = ref(false);
const handleSave = async () => { isSave.value = true; buttonSound(); await loadData(); };
const isLoad = ref(false);
const handleLoad = async () => { isLoad.value = true; buttonSound(); await loadData(); };
const title = ref([]);
const timestamp = ref([]);


const handleCurrentAudio = async () => {
  // 1. 如果正在加载中，先不处理（防止重复点击叠加）
  if (!AImessage.value) return

  try {
    // 2. 停止并重置当前正在播放的声音
    audioInstance.pause();
    audioInstance.currentTime = 0;

    // 3. 获取最近的一条音频 URL
    const latestUrl = audioUrl.value[audioUrl.value.length - 1]
    if (!latestUrl) return

    // 4. 处理 URL 拼接（确保路径正确）
    const baseUrl = import.meta.env.VITE_APP_API_URL.replace(/\/$/, '');
    const filePath = latestUrl.startsWith('/') ? latestUrl : `/${latestUrl}`;
    const audioPath = `${baseUrl}${filePath}`;

    // 5. 复用全局的 audioInstance
    audioInstance.src = audioPath;

    // 6. 监听状态：播放时开启嘴型同步，结束时关闭
    audioInstance.onplay = () => { 
        loading.value = true; // 开启 animateLipSync 里的频率采集
    };
    audioInstance.onended = () => { 
        loading.value = false; // 结束播放，模型闭嘴
    };

    // 7. 初始化音频环境（如果你之前没点过自动播放，这步能保证 Analyser 连上）
    await initAudioSystem();

    // 8. 播放
    await audioInstance.play();
    
  } catch (err) {
    console.error("手动播放音频失败:", err)
    loading.value = false;
  }
}

const loadData = async () => {
  const response = await chatApi.getLoadList();
  response.data.forEach((i, index) => {
    if(i){
      title.value[index] = i.textList[i.textList.length - 1].user;
      timestamp.value[index] = localTime(i.timestamp);
    }
  });
};

const loadDialogData = async (index) => { 
  buttonSound();
  const response = await chatApi.getLoadList();
  const data = response.data;
  audioUrl.value = data[index].audioUrl;
  textList.value = data[index].textList;
  conversation_id.value = data[index].conversation_id;
};

const saveData = async (slotIndex) => {
  const payload = {
    conversation_id: conversation_id.value,
    slot: slotIndex + 1,
    timestamp: new Date().toISOString(),
    data: { textList: textList.value, audioUrl: audioUrl.value }
  }
  if(payload.data.audioUrl.length > 0) { 
    await chatApi.saveData(payload);
    loadData();
  }
};


</script>

<template>
<div class="bg"></div>
<div class="logo" @click="toHome">{{ $t('nav.logo') }}</div>
<div class="textBox" v-show="AImessage !== ''" >
  <span class="text-content" ref="showTextbox"></span>
  <span class="inline-replay" @click="handleCurrentAudio" v-if="!loading">
    <img src="@/assets/image/icon_volume.svg" alt="播放" />
  </span>
</div>
<div class="nav">
  <ul>
    <router-link to="/home"><li>{{ $t('nav.home') }}</li></router-link> 
    <router-link to="/music"><li>{{ $t('nav.classic') }}</li></router-link> 
    <li @click="handleLog">{{ $t('nav.log') }}</li>
    <li @click="handleSave">{{ $t('nav.save') }}</li>
    <li @click="handleLoad">{{ $t('nav.load') }}</li>
  </ul>
</div>
  <div class="canvas-container">
      <canvas ref="liveCanvas" id="canvas"></canvas>
  </div>
  <div class="fixLayout">
      <div class="input_container">
        <textarea 
        class="input_box" 
        :placeholder="$t('nav.placeholder')"
        maxlength="500"
        spellcheck="false"
        v-model.trim="inputValue"              
        @keydown.enter.exact.prevent="sendMessage" 
        name="input"  
        ></textarea>
        <div class="send" @click="sendMessage" v-if="!loading">
          <img src="@/assets/image/send.svg" alt="#">
        </div>
        <div class="loading" v-if="loading">
          <ul><li></li><li></li><li></li></ul>
        </div>
      </div> 
  </div>

  <Dialog v-show="isLog" @handleLog="handleLog" :textList="textList" :audioUrl="audioUrl"></Dialog> 
  <SaveData v-show="isSave" @saveData="saveData" @closeSave = "isSave = false; buttonSound()" :title="title" :timestamp="timestamp"></SaveData> 
  <LoadData v-show="isLoad" @loadDialogData="loadDialogData" @closeLoad = "isLoad = false; buttonSound()" :title="title" :timestamp="timestamp"></LoadData> 
</template>

<style lang="scss" scoped>
.bg {
  width: 100%;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: -100;
  background: url('@/assets/image/AI_bg.jpg') no-repeat;
  background-size: cover ;
}
// .bg {
//   width: 100%;
//   height: 100vh;
//   position: fixed;
//   top: 0;
//   left: 0;
//   z-index: -100;
  
//   // 1. 使用遮罩层防止背景太亮抢戏
//   &::after {
//     content: '';
//     position: absolute;
//     top: 0;
//     left: 0;
//     width: 100%;
//     height: 100%;
//     background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.1)); // 顶部加深
//     pointer-events: none;
//   }

//   // 2. 增加轻微的模糊和缩放效果，提升交互感
//   background: url('src/assets/image/AI_bg.jpg') no-repeat;
//   background-size: cover;
//   background-position: center;
//   filter: brightness(0.8) contrast(1.1); // 降低亮度，提高对比度
// }
img {
  width: 100%;
  height: 100%;
}
.logo {
    position: fixed;
    font-size: 4rem;
    // font-family: "STXingkai", "华文行楷", cursive;
    top: 0;
    left: 0;
    color: #d4af37;
    padding: 2.2rem 0 1rem 3rem;
    cursor: pointer;
    z-index: 1000;
    &:lang(en) {
      font-family: "Segoe UI", "华文行楷", cursive;
      font-weight: bold;
    }
}
.canvas-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: fixed;
  bottom: 0;
  left: 0;

}
 
#canvas {
  width: 100%;
  height: 100%;
  display: block;  
}
.nav {
    font-family: "思源宋体", serif;
    position: absolute;
    left: 12%;
    top: 50%;
    min-width: 20%;
    // height: 100%;
    // padding-left: 18rem;
    z-index: 500;
    transform: translateY(-50%);
  ul {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4rem;
  }
  li {
    padding: 2rem;
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    color: black;
    cursor: pointer;
    transition: all 0.33s;
    backdrop-filter: blur(6px);
    border-radius: 4px;
    transform: skewX(-10deg);
    background: rgba(255, 255, 255, 0.15);
    &:hover {
      text-shadow: 0 0 10px rgb(230, 228, 228);
      padding: 2rem 5rem;
      
    }
  }



}

.textBox {
  position: absolute;
  top: 15%;
  left: 60%;
  margin-right: 3rem;
  max-height: 50vh;    
  min-height: 100px;
  width: 350px;       
  overflow-y: auto;    
  padding: 2rem; 
  padding-bottom: 4.5rem; 
  color: black;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  font-size: 20px;
  font-family: "思源宋体", serif;
  text-align: left;
  transition: all 0.5s;
  z-index:88;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
  }

  .text-content {
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.5;
    display: block;
  }

  .inline-replay {
    /* 3. 核心：改为 position: sticky 或保持 absolute */
    /* 如果想让按钮始终固定在框的右下角，哪怕滚动文字也不消失： */
    position: fixed; 
    float: right;
    margin-top: -3rem; /* 将按钮向上提一点，贴合在内容区域右下角 */
    right: calc(100% - 60% - 350px + 1.5rem); 
    bottom: calc(100% - 15% - 50vh + 1rem);
    
    /* 或者维持 absolute，但要确保父容器 padding-bottom 足够 */
    position: absolute;
    right: 1.5rem;   
    bottom: 1rem;    
    
    width: 4rem;
    height: 4rem;
    cursor: pointer;
    background: white; /* 滚动时为了不被文字背景干扰，建议加个实色背景或阴影 */
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border-radius: 50%;
    padding: 8px;
    z-index: 88888;
    transition: all 0.2s;

    &:hover {
      transform: scale(1.1);
      background: #f0f0f0;
    }

    img {
      width: 100%;
      height: 100%;
      display: block;
      opacity: 0.8; 
    }
  }
}
.fixLayout {
    position: fixed;
    left: 50%;
    bottom: 2rem;
    width: 60%;
    transform:translateX(-50%);
    // padding: 2.5rem 6rem;
    border-radius: 10px;
}
.input_container .input_box {
    resize: none;
    outline: none;
    border: none;
    width: 100%;
    height: 100%;
    font-size: 25px;
    position: relative;
    padding: 2.5rem 6rem;
    border-radius: 10px;
    overflow-y: scroll;
    &::-webkit-scrollbar {
        display: none;
    }
}
.send {
  position: absolute;
  top: 50%;
  right: 3rem;
  transform: translateY(-50%);
  width: 3.5rem;
  height: 3.5rem;
  &:hover{
    cursor: pointer;
  }
}
.loading {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  ul {
    display: flex;
  
  }
  ul li {
    width: 1.5rem;
    height: 1.5rem;
    background-color: #882014;
    margin: 0 .5rem;
    border-radius: 50%;
    animation: animate 1.4s linear infinite;
    &:nth-child(1) {
      animation-delay: 0 ;
    }
    &:nth-child(2) {
      animation-delay: -1.2s ;
    }
    &:nth-child(3) {
      animation-delay: -1s ;
    }
  }
 
}
.chatBox {
  position: fixed;
  width: 8rem;
  height: 8rem;
  left: 10%;
  top: 20%;
  background-color: white;
  border-radius: 30%;
  cursor: pointer;
  z-index: 100;
  transition: all .2s;
  .chat{ 
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6rem;
    height: 6rem;

  }
}
@keyframes animate {
  0% {
    transform: translateY(0);
  }
  60% {
    transform: translateY(0);
  }
  80% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
}



 
</style>