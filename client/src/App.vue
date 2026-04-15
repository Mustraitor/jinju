<script setup>


</script>

<template>
<div id="app">
    <router-view></router-view>  
</div>
</template>

<style>
:root {
  --primary-color: #c62b29;      /* 晋剧红 */
  --secondary-color: #d4af37;    /* 戏台金 */
  --dark-color: #3a2618;         /* 古木色 */
  --light-color: #f8f3e6;        /* 宣纸米白 */
  --bg-cloud: rgba(255,255,255,.15);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
li,a {
    list-style: none;
    text-decoration: none;
}
/* 中文字体 */
html.lang-zh, html.lang-zh body, html.lang-zh #app, html.lang-zh .font {
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
}

/* 英文字体 */
html.lang-en, html.lang-en body, html.lang-en #app, html.lang-en .font {
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
  font-size: .6rem;
}
html, body {
  height: 100vh;
  font-size: 10px;
  font-family: "STXingkai", "华文行楷", cursive;
  font-weight: 400;
  font-style: normal;
  scroll-behavior: smooth;
}
#app {
  width: 100%;
  height: 100vh;
  margin: 0 auto;
  text-align: center;
  font-family: "STXingkai", "华文行楷", cursive;
}
input textarea {
  outline: none;
  border: none;
}


</style>
