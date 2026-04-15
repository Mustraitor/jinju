//防抖函数
export const debounce = (func, delay = 100) => {
  let timer;
  return function() {
    clearTimeout(timer)
    timer = setTimeout(() => func.apply(this, arguments), delay)
  }
}