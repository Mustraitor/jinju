<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import fetchWrapper from '@/utils/fetchWrapper'
import { useUserStore } from '@/stores/user'
import Translate from './translate.vue'

onMounted( async () => {
    await userInfo() 
})
const userStore = useUserStore()
const router = useRouter()
const toHome = () => {
    router.push('/home')
}
const username = ref('') 
const userInfo = async () => {
    const response = await fetchWrapper('/my/userInfo')
    const userInfo = response.data
    username.value = userInfo.username
    console.log(username.value);
    
    
} 
const isConfirm = ref(false)
// const slotIndex = ref(null)
const handleConfirm = () => { 
    isConfirm.value = !isConfirm.value 

    
}
const isYes = () => { 
    isConfirm.value = false
    userStore.removeToken()
    router.push('/login')
}



</script> 
<template>
    <section class="header">
        <div class="logo" @click="toHome">{{ $t('header.title') }}</div>
        <ul>
            <router-link to="/home"><li>{{ $t('header.home') }}</li></router-link>
            <router-link to="/music"><li>{{ $t('header.classics') }}</li></router-link>
            <router-link to="/chatAI"><li>{{ $t('header.agent') }}</li></router-link>
            <router-link to="/graph"><li>{{ $t('header.graph') }}</li></router-link>
            <router-link to="/video"><li>{{ $t('header.video') }}</li></router-link>
            <li class="username" @click="handleConfirm">{{ username }}</li>
            <Translate/>
        </ul>
        <div class="layout" v-show="isConfirm">
            <div class="confirm">
                <span style="margin-bottom: 8rem;">{{ $t('logout.confirmTitle') }}</span>
                <div class="confirm_choice">
                    <span class="yes" @click="isYes">{{ $t('logout.yes') }}</span>
                    <span class="no" @click="isConfirm = false">{{ $t('logout.no') }}</span>
                </div>
            </div>
        </div>
    </section>
</template>
<style lang="scss" scoped>
:root {
    --primary-color: #c62b29;
    --secondary-color: #d4af37;
    --dark-color: #3a2618;
    --light-color: #f8f3e6;
    --accent-color: #8e3b46;
}
.header {
    display: flex;
    position: sticky;
    top: 0;
    left: 0;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    width: 100%;
    height: 10vh;
    padding: 1rem 0 1rem 3rem;
    background: linear-gradient(to right,#88180b, #8a342b );
    // cursor: pointer;
    z-index: 9999 !important;
    // font-family: "Segoe UI", "华文行楷", cursive;
    ul {
        display: flex;
        justify-content: space-between;
        font-size: 2.5rem;
        margin-right: 3rem;
        
    }
    li {
        cursor: pointer;
        margin: 1rem;
        padding: 1rem 2rem;
        border-radius: 10px;
        color: #f8f3e6;
        font-weight: 500;
        transition: all .2s ease-in-out;
        &:hover {
            background-color: #d4af37;
            color: white;
        }  
    }

}
.logo { 
    // position: fixed;
    font-size: 4rem;
    // top: 6%;
    // left: 6%;
    color: #d4af37;
    cursor: pointer;
    z-index: 1000;
}
.layout {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    // background: rgba(0, 0, 0, 0.7);
    // font-family: Arial,PingFang SC,Hiragino Sans GB,STHeiti,Microsoft YaHei,sans-serif;

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


</style>