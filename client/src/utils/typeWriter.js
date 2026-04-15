export const typeWriter = (text, element, delay = 50) => {
  element.innerHTML = "";
  let i = 0;
  
  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, delay);  // 控制输出速度
    }
  }
  
  type();
}