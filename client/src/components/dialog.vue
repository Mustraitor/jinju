<script setup>
import fetchWrapper from '@/utils/fetchWrapper'
import { ref } from 'vue'
const props = defineProps([ 'textList', 'audioUrl'])
const audio = ref()

//删除音频对象
const deleteAudio = () => {
    if(audio.value){
        audio.value.pause();
        audio.value= null;
    }
 
}
const handleAudio = async (index) => {
    deleteAudio()
    // console.log(audioUrl);
    // console.log(audioUrl[index]);
    console.log(props.audioUrl[index]);
    
    const response = await fetchWrapper(props.audioUrl[index])
    audio.value = new Audio(response)
    audio.value.play()
    
}




</script>
<template>
    <div class="container">
    <!-- {{ props.message }} -->
      <div class="dialog_list">
        <div class="dialog_group" v-for="(item,index) in props.textList" :key="item.id">
            <div class="item">
                <div class="profile">
                    <!-- <img src="" alt="#"> -->
                     YOU
                </div>
                <div class="dialog">{{ item.user }} </div>
                
            </div>
            <div class="item">
                <div class="profile">
                    <!-- <img src="" alt="AI"> -->
                     AI
                </div>
                <div class="dialog">{{ item.AI }} </div>
                <div class="replay" @click="handleAudio(index)">
                    <img src="@/assets/image/icon_volume.svg" alt="#">
                </div>
            </div>
        </div>
      </div>
      <div class="back" @click="$emit('handleLog')">
        <span @click="deleteAudio">返回</span>
    </div>
    </div>
</template>
<style lang="scss" scoped>

.container {
    position: fixed;
    // background-color: rgba(30, 30, 30, 0.8);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    width: 100%;
    height: 100vh;
    font-size: 20px;
    font-family: "思源宋体", serif;
    z-index: 2500;
}
.dialog_list {
    display: flex;
    flex-direction: column;
    margin-top: 5rem;
    height: 70%;
    overflow-y: scroll;
    &::-webkit-scrollbar {
        display: none;
    }
    .dialog_group {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        // text-align: left;
    }
    
}
.item {
    position: relative;
    display: flex;
    align-items: center;
    // justify-content: center;
    // align-items: center;
    width: 50%;
    padding: 4rem 0;
    border-bottom: 2px solid white;
    .dialog {
        padding: 0 3rem;
        text-align: left;
    }

}
.back {
    position: fixed;
    right: 10rem;
    bottom: 10rem;
    padding: 1.5rem 2.5rem;
    color: #e5e5e8;
    cursor: pointer;
    transition: all 0.33s;
    // backdrop-filter: blur(5px);
    border-radius: 10px ;
    background: rgba(255, 255, 255, 0.15);
    z-index: 1000;
    transition: all .5s;
    &:hover {
        // background-color: wheat;
        transform: scale(1.2);
    }
}
.replay {
    position: absolute ;
    right: 5% ;
    bottom: 5% ;
    width: 4rem;
    height: 4rem; 
    cursor: pointer;
    img {
        width: 100%;
        height: 100%;
    }
}

</style>