import { defineStore } from 'pinia';
import { ref } from 'vue';
import { i18n }from '@/i18n.js'; // 请确保路径指向你的 i18n 配置文件

export const useLangStore = defineStore('lang', () => {
  // 1. 初始化：优先从本地读取，没有则默认为中文
  const currentLang = ref(localStorage.getItem('lang') || 'zh');
  
  // 2. 初始化时执行一次同步（解决刷新问题）
  const initLang = () => {
    applyLang(currentLang.value);
  };

  // 3. 核心切换逻辑
  const setLanguage = (isEn) => {
    currentLang.value = isEn ? 'en' : 'zh';
    applyLang(currentLang.value);
    localStorage.setItem('lang', currentLang.value);
  };

  // 私有工具函数：处理 i18n 和 DOM class
  const applyLang = (lang) => {
    i18n.global.locale.value = lang;
    document.documentElement.classList.remove('lang-zh', 'lang-en');
    document.documentElement.classList.add(`lang-${lang}`);
  };

  return { currentLang, setLanguage, initLang };
});