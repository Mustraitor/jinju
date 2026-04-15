import { createI18n } from 'vue-i18n';
import zh from './locales/zh.json';
import en from './locales/en.json';

// 核心逻辑：从本地存储获取语言设置，如果没有（第一次访问），则默认为 'zh'
const savedLang = localStorage.getItem('lang') || 'zh';
export const i18n = createI18n({
  legacy: false,        // Composition API 模式
  locale: savedLang,    // 使用读取到的持久化语种
  fallbackLocale: 'en', // 回退语言
  messages: {
    zh,
    en
  }
});

