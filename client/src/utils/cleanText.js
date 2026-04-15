export function cleanText(text) {
  return text
    .replace(/\^\[\d+\]/g, '')  // 移除 ^[数字] 格式
    .replace(/\[\d+\]\^/g, '')   // 移除 [数字]^ 格式
    .replace(/\*/g, '')          // 移除星号
    .replace(/\[\d+\]/g, '')   // 移除 [数字] 格式
    .replace(/\^+/g, '')
}