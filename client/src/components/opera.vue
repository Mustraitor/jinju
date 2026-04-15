<template>
<section class="opera">
    <div class="title">{{ $t('classics.sectionTitle') }}</div>

    <div class="opera_card">
        <div class="col">
            <div class="opera_card_img">
                <img src="@/assets/image/opera1.jpeg" alt="Hitting the Golden Bough">
            </div>
            <div class="title">{{ $t('classics.opera1.name') }}</div>
        </div>
        <div class="col">
            <div class="title">{{ $t('classics.synopsis') }}</div>
            <p>{{ $t('classics.opera1.desc') }}</p>
            <router-link to="/video">
                <span>{{ $t('classics.more') }}</span>
            </router-link>
        </div>
    </div>

    <div class="opera_card">
        <div class="col">
            <div class="opera_card_img">
                <img src="@/assets/image/opera2.jpg" alt="Ascending the Throne">
            </div>
            <div class="title">{{ $t('classics.opera2.name') }}</div>
        </div>
        <div class="col">
            <div class="title">{{ $t('classics.synopsis') }}</div>
            <p>{{ $t('classics.opera2.desc') }}</p>
            <router-link to="/video">
                <span>{{ $t('classics.more') }}</span>
            </router-link> 
        </div>
    </div>
</section>

</template>
<style lang="scss" scoped>
.col {
    display: flex;
    align-items: center;
    flex-direction: column;
    margin: auto 0;
    flex: 1; // 增加这一行，让左右两列平分空间
    padding: 2rem; // 增加内边距，防止文字贴边
    position: relative; // 为内部的 span 提供定位参考
}

.opera {
    padding: 4rem 10rem;
    font-size: 3.5rem;
    font-weight: 500;
    letter-spacing: 0.5rem;
    transition: all 0.2s;
    width: 100%;
    background-color: #f8f3e6;

    .title {
        margin: 6rem 0;
    }

    &_card {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: stretch; // 核心：让两列高度始终对齐
        margin-bottom: 10rem;
        overflow: hidden;
        font-size: 2.2rem; // 稍微调小一点基准字号，适应英文长句子
        border-radius: 3px;
        background-color: rgba(255, 255, 255, 0.5);
        box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.15);
        transition: all 0.2s;

        &:hover {
            transform: translateY(-1.5rem) scale(1.03);
        }

        .title {
            padding-bottom: 1.5rem;
            margin: 0;
            font-size: 2.8rem; // 标题可以大一点
        }

        p {
            text-align: left;
            line-height: 1.6; // 增加行高，解决英文挤在一起的问题
            letter-spacing: 0.1rem; 
            margin-bottom: 4rem; // 为底部的 Learn More 留出空间
        }

        // 针对英文环境的特殊微调
        &:lang(en) {
            p {
                font-size: 1.8rem; // 英文句子长，调小字号防止容器太长
                line-height: 1.5;
                letter-spacing: 0; // 英文不需要太宽的间距
                text-align: justify; // 英文开启两端对齐更整齐
            }
            .title {
                font-size: 2.2rem;
                letter-spacing: 0.1rem;
            }
        }

        span {
            position: absolute;
            bottom: 1rem; // 稍微往上提一点，不要紧贴边缘
            right: 2rem;
            padding: 0.8rem 1.5rem;
            font-size: 1.8rem;
            color: #d1a936;
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
                color: #f8f3e6;
                background-color: #d1a936;
                border-radius: 5px;
            } 
        }

        &_img {
            width: 15rem;
            height: 15rem;
            border-radius: 50%;
            background-color: black;
            margin: 2rem;
            flex-shrink: 0; // 防止头像被长文本挤扁

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 50%;
            }
        }
    }
}
</style>