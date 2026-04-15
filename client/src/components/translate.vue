<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useLangStore } from '@/stores/lang';

const langStore = useLangStore();
// 使用 storeToRefs 保持响应式
const { currentLang } = storeToRefs(langStore);

// 计算属性绑定到 el-switch
const isEnglish = computed({
  get: () => currentLang.value === 'en',
  set: (val) => langStore.setLanguage(val)
});
</script>

<template>
  <div class="lang-switcher">
    <span class="lang-label">中文</span>
    <el-switch
        v-model="isEnglish"
        class="ml-2"
        style="--el-switch-on-color: #f6f6f6; --el-switch-off-color: #ff4949"
    />
    <span class="lang-label">English</span>
  </div>
</template>
<style lang="scss" scoped>
.lang-switcher {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
}
.lang-label {
  color: white;
  font-size: 1.9rem;
}

</style>


