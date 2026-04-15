<script setup>
import { ref } from 'vue'
const props = defineProps(['title', 'timestamp'])
const emit = defineEmits(['saveData', 'closeSave'])
const saveSlots = ref(Array(9).fill("NO DATA"))
const isConfirm = ref(false)
const slotIndex = ref(null)
const handleConfirm = (index) => { 
    isConfirm.value = !isConfirm.value 
    slotIndex.value = index  
}
const isYes = () => { 
    isConfirm.value = false
    emit('saveData', slotIndex.value)
}

</script>
<template>
    <div class="saveDataContainer">
        <div class="saveTitle">{{ $t('save.title') }}</div>
        
        <div class="saveData">
            <div class="saveData_item" @click="handleConfirm(index)" v-for="(item,index) in saveSlots" :key="index">
                <div class="title">{{ title[index] || $t('save.noData') }}</div>
                <div class="timestamp">{{ timestamp[index] }}</div>
            </div>
        </div>

        <div class="layout" v-show="isConfirm">
            <div class="confirm">
                <span style="margin-bottom: 8rem;">{{ $t('save.confirmMsg') }}</span>
                <div class="confirm_choice">
                    <span class="yes" @click="isYes">{{ $t('save.yes') }}</span>
                    <span class="no" @click="isConfirm = false">{{ $t('save.no') }}</span>
                </div>
            </div>
        </div>

        <div class="back" @click="$emit('closeSave')">{{ $t('save.back') }}</div>
    </div>
</template>
<style lang="scss" scoped>
.saveDataContainer {
    position: relative;
    width: 100%;
    height: 100vh;
    display: flex; 
    align-items: center; 
    background-color: rgba(0,0,0, .6);
    z-index: 2500;
}
.saveTitle {
    position: fixed;
    top: 2rem;
    left: 3rem;
    font-size: 4.5rem;
    color: white;
}
.saveData {
    display: grid;
    grid-template-columns: repeat(3, 30rem); 
    gap: 3rem; 
    justify-content: center;
    margin: 0 auto; 
    max-width: 90vw; 
    &_item {
        display: flex;
        flex-direction: column;
        // align-items: center;
        justify-content: center;
        height: 18rem;
        background: #e5e5e8;
        border: 5px solid #e4ddd9;
        font-size: 1.8rem;
        text-align: center;
        padding: 2rem;
        overflow-y: auto;
        overflow-x: hidden;
        box-sizing: border-box;
        cursor: pointer;
        &:hover {
            border: 5px solid #88180b ;
        }
        .title {
            padding: 3rem;
        }
    }
}
.layout {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    // background: rgba(0, 0, 0, 0.7);
    z-index: 2500;
}
.confirm {
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50rem;
    height: 30rem;
    background-color: rgba(255,255,255,.8);
    font-size: 3rem;
    &_choice {
        display: flex;
        justify-content: center;
        gap: 10rem;
        
    }
    .yes,
    .no {
        font-size: 2rem;
        padding: 1rem 5rem;
        cursor: pointer;
        position: relative;
        text-decoration: none;
        color: white;
        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: -1;
            background: black;
            transform: skewX(-20deg);
        }
        &:hover::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: -1;
            background: #fc5531;
            transform: skewX(-20deg);
        }
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
    font-size: 2rem;
    transition: all .5s;
    &:hover {
        // background-color: wheat;
        transform: scale(1.2);
    }
}


</style>