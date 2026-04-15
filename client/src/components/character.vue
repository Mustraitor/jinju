<script setup>
import { useI18n } from 'vue-i18n';
import playerBg from '@/assets/image/player_bg.jpg';

const { tm, t } = useI18n();

// 动态获取本地图片的工具函数
const getAssetsFile = (fileName) => {
    return new URL(`../assets/image/character/${fileName}`, import.meta.url).href;
};
</script>

<template>
<section class="character-list" :style="{ backgroundImage: `linear-gradient(to right bottom, rgba(33, 32, 32, 0.2), rgba(44, 43, 43, 0.5)), url(${playerBg})` }">
    <div class="title">{{ t('artists.title') }}</div>
    
    <ul class="row">
        <li v-for="(item, index) in tm('artists.list')" :key="index">
            <div class="picture">
                <img :src="getAssetsFile(item.img)" alt="Artist Portrait">
            </div>
            
            <span class="character-name">{{ t(`artists.list[${index}].name`) }}</span>
            <span class="role">{{ t(`artists.list[${index}].role`) }}</span>
            <p class="description">{{ t(`artists.list[${index}].desc`) }}</p>
            
            <div class="decoration"></div>
        </li>
    </ul>

    <div class="btn_text">
        <a href="https://wiki66.com" target="_blank" rel="noopener noreferrer">
            {{ t('artists.learnMore') }}
        </a>
    </div>
</section>
</template>

<style lang="scss" scoped>
a {
    color: inherit;
    text-decoration: none;
}

.character-list {
    width: 100%;
    position: relative;
    overflow: hidden;
    // 基础字体设为行楷，但增加备用字体
    font-family: "Segoe UI", "华文行楷", "Microsoft YaHei", serif;
    padding: 0 10rem;
    border-radius: 4px;
    background-size: cover;
    background-position: bottom center;
 

    // --- 核心适配：英文环境下的全局微调 ---
    &:lang(en) {
        font-family: 'Noto Sans', 'Arial', 'Helvetica', sans-serif;
        .title {
            letter-spacing: 0.2rem;
            text-transform: uppercase;
        }
    }
}

.title {
    font-size: 3.5rem;
    font-weight: 500;
    margin: 6rem 0;
    letter-spacing: 0.5rem;
    transition: all 0.2s;
}

.row {
    display: flex;
    width: 100%;
    height: 48rem; // 稍微增加高度，防止英文描述溢出

    li {
        position: relative;
        height: 100%;
        flex: 1; // 使用等分
        border: 1px solid rgba(255, 255, 255, 0.1);
        overflow: hidden;
        cursor: pointer;
        transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.3);
        background-color: rgba(255, 255, 255, 0.05);

        &:hover {
            flex: 3; // 展开比例稍微缩小一点点，增加稳定性
            z-index: 10;
            background-color: rgba(255, 255, 255, 0.1);
        }

        &:hover .picture {
            transform: scale(0.9); // 缩小一点图片，给文字留空间
            margin-bottom: 1rem;
        }

        &:hover .role {
            transform: translateY(0);
            opacity: 1;
        }

        &:hover .description {
            max-height: 250px;
            opacity: 1;
            margin-top: 1.5rem;
        }

        &:not(:last-child) {
            border-right: none;
        }

        .character-name {
            font-size: 2.2rem;
            margin-top: 1rem;
            white-space: nowrap; // 名字不折行
        }
    }
}

.picture {
    width: 16rem;
    height: 16rem;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid rgba(255, 255, 255, 0.3);
    margin-bottom: 2rem;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    transition: all 0.5s ease;
    flex-shrink: 0;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.role {
    position: absolute;
    top: 2rem;
    right: 2rem;
    padding: 0.4rem 1.2rem;
    background-color: rgba(209, 169, 54, 0.9);
    color: #fff;
    border-radius: 4px; // 改为小圆角，更有现代感
    font-size: 1.4rem;
    font-weight: bold;
    font-family: sans-serif; // 行当标签统一用系统默认无衬线
    transform: translateY(-20px);
    opacity: 0;
    transition: all 0.4s ease;
}

.description {
    font-size: 1.8rem;
    text-align: justify; // 两端对齐
    line-height: 1.5;
    max-height: 0;
    opacity: 0;
    overflow-y: auto; // 内容过多时允许滚动
    transition: all 0.5s ease;
    padding: 0 1rem;
    color: #f0f0f0;

    // 针对英文版的文本微调
    &:lang(en) {
        font-size: 1.5rem;
        line-height: 1.3;
        hyphens: auto; // 开启单词连字符
    }

    // 隐藏滚动条但保留功能
    &::-webkit-scrollbar {
        width: 0px;
    }
}

.btn_text {
    margin: 4rem auto;
    padding: 0.8rem 2rem;
    border: 1px solid rgba(0, 0, 0, 0.8);
    color: black;
    width: fit-content; // 核心：自适应中英文宽度
    min-width: 12rem;
    font-size: 1.8rem;
    text-align: center;
    transition: all 0.3s;
    cursor: pointer;
    
    &:hover {
        background-color: #000;
        color: #f8f3e6;
    }
}
</style>