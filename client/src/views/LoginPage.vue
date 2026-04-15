<script setup>
import { ref } from 'vue'
import router from '@/router/index.js'
import  { useUserStore }  from '@/stores/user.js'
import { debounce } from '@/utils/debounce'
import { userApi } from '@/api/user'
const store = useUserStore()
const isActive = ref(false)
const loginUsername = ref('')
const loginPassword = ref('')
const registerUsername = ref('')
const registerPassword = ref('')
const confirmPassword = ref('')
//卡片翻转
const cardRotate = () => {
    isActive.value = !isActive.value
    // console.log(loginUsername.value);
    loginUsername.value = ''
    loginPassword.value = ''
    registerUsername.value = ''
    registerPassword.value = ''
    confirmPassword.value = ''
    errors.value = {
        username: '',
        password: '',
        confirmPassword: ''
    }
}
// 错误信息存储
const errors = ref({
  username: '',
  password: '',
  confirmPassword: ''
});
// 表单校验
const validateForm = () => {
    let valid = true;
    errors.value = { username: '', password: '', confirmPassword: '' }
    if (!registerUsername.value) {
        errors.value.username = '用户名不能为空';
        valid = false;
    }
    if (registerUsername.value.length>10) {
        errors.value.username = '用户名长度不超过10位';
        valid = false;
    }
    if (!registerPassword.value) {
        errors.value.password = '密码不能为空';
        valid = false;
    } else if (registerPassword.value.length < 6) {
        errors.value.password = '密码长度至少为6位';
        valid = false;
    }else if(registerPassword.value.length > 12){
        errors.value.password = '密码长度不超过12位';
        valid = false;
    }
    if (registerPassword.value !== confirmPassword.value) {
        errors.value.confirmPassword = '两次密码不一致';
        valid = false;
    }
    return valid;
}
// 提交注册表单
const submitRegister = async () => {
    // 1. 先进行前端校验
    if (!validateForm()) return

    try {
        // 2. 调用 API 层
        const response = await userApi.register(registerUsername.value, registerPassword.value)
        
        // 3. 处理响应结果
        if (response.success) {
            ElMessage({
                message: '注册成功',
                type: 'success',
                plain: true,
            })
            cardRotate()
        } else {
            ElMessage({
                message: response.message || '用户名已存在',
                type: 'error',
                plain: true,
            })
        }
    } catch (error) {
        console.error('请求异常:', error)
    }
}
// 提交登录表单
const submitLogin = async () => {
    try {
        // 调用 API 层
        const response = await userApi.login(loginUsername.value, loginPassword.value)
        
        // 存储 Token
        if (typeof response.token === 'string') {
            store.setToken(response.token)
        }

        if (response.success) {
            ElMessage({
                message: '登录成功',
                type: 'success',
                plain: true,
            })
            setTimeout(() => { 
                if (store.user_type === 1) {
                    router.push('/admin')
                } else {
                    router.push('/home')
                } }, 1000)
        } else {
            ElMessage({
                message: response.message || '登录失败',
                type: 'error',
                plain: true,
            })
        }
    } catch (error) {
        console.error('登录异常:', error)
    }
}
const debouncesubmitLogin = debounce(() => { submitLogin() },400)
const debouncesubmitRegister = debounce(() => { submitRegister() },400)
</script>

<template>
    <div class="bg"></div>
    <div class="logo">晋韵智传</div>
    <div class="card" :class="{changeCard:isActive}">
        <div class="front">
            <form action="" class="login">
                <h2 class="login_title">登录</h2>
                <input type="text" class="login_username" placeholder="请输入用户名" v-model="loginUsername">
                <input type="password" class="login_password" placeholder="请输入密码"v-model='loginPassword'>
                <el-button class="login_button" :plain="true" @click="debouncesubmitLogin">确认</el-button>
                <span style="font-size: 14px; " @click="cardRotate" >点我注册？</span>
            </form>
        </div>
        <div class="back">
            <img src="../assets/image/return.svg" alt="" class='back_return'  @click="cardRotate">
            <form action="" class="register">
                <h2 class="register_title">注册</h2>
                <input type="text" class="register_username" placeholder="请输入用户名" v-model="registerUsername" @input="validateForm" :class="{'redBorder': errors.username}">
                <span v-if="errors.username" class="register_validate">{{ errors.username }}</span>
                <input type="password" class="register_password" placeholder="请输入密码" v-model="registerPassword"@input="validateForm" :class="{'redBorder': errors.password}">
                <span v-if="errors.password" class="register_validate">{{ errors.password }}</span>
                <input type="password" class="register_password" placeholder="请确认密码"v-model="confirmPassword"@input="validateForm" :class="{'redBorder': errors.confirmPassword}">
                <span v-if="errors.confirmPassword" class="register_validate">{{ errors.confirmPassword }}</span>
                <el-button :plain="true" class="register_button" @click="debouncesubmitRegister">注册</el-button>
            </form>
        </div>
    </div>


</template>

<style scoped lang="scss">
.bg {
    position: fixed;
    height: 100vh;
    // background: url('../assets/image/bg1.jpg') center top / cover no-repeat ;
    background: url('../assets/image/player_bg.jpg');
    width: 100%;
    z-index: -10;
}
.logo {
    position: fixed;
    font-size: 4rem;
    font-family: "STXingkai", "华文行楷", cursive;
    top: 0;
    left: 0;
    color: #d4af37;
    padding: 2.2rem 0 1rem 3rem;
    cursor: pointer;
    z-index: 1000;
}
.card {
    position: relative;
    max-width: 400px;
    height: 50rem;
    top: 50%;
    left: 50%;
    transform-style: preserve-3d;
    transform: translate(-50%, -50%);
    transition: transform .5s;
    background-color: rgba(255,255,255,0.5);
    border-radius: 30px;
    
}

.front,
.back {
    width: 100%;
    height: 100%;
    position: absolute;
    backface-visibility: hidden;

}

.front {
    transform: rotateY(0deg);
}

.back {
    transform: rotateY(180deg);
}
.changeCard {
   transform: translate(-50%, -50%) rotateY(180deg);

}
// .card:hover {
//     transform: translate(-50%, -50%) rotateY(180deg);
// }
input:hover {
    border: 1px solid #a1a1aa;
}
.login,
.register {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 25px;
    padding: 0 40px;
    
    &_title {
        font-size: 3rem;
        margin: 50px 0;
    }
    &_username {
        padding: 15px 35px;
        border: 1px solid rgba(255,255,255,0.5);
        border-radius: 10px;
        outline: none;
    }
    &_password {
        padding: 15px 35px;
        border: 1px solid rgba(255,255,255,0.5);
        border-radius: 10px;
        outline: none;
    }
    &_button {
        font-size: 16px;
        margin-top: 12px;
        padding: 28px 0;
        border: 1px solid rgba(255,255,255,0.5);
        cursor: pointer;
        border-radius: 10px;
        background-color: #f5e3df;
        color: #000000;
        &:hover {
            border: 1px solid #a1a1aa;
        }

    }
    &_validate {
        float: left;
        color: red;
        margin: -18px 0;
        text-align: left;
        padding-left: 36px;
    }
}
.login span:hover {
    cursor: pointer;
}
.back_return {
    width: 4rem;
    height: 4rem;
    position: absolute;
    top: 49px;
    left: 41px;
    z-index: 2;
    cursor: pointer;
}
.redBorder {
    border: 1px solid red;
}
</style>