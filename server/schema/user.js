import joi from 'joi'
// 定义登录表单验证规则
const username = joi.string().min(1).max(10).required()
const password = joi.string().pattern(/^[\S]{6,12}$/).required()
const reg_login_schema = {
    body: {
        username,
        password
    }
}
// 定义更新表单的验证规则
const id = joi.number().integer().min(1).required()
const email = joi.string().email()
const update_userInfo_schema = {
    body: {
        id,
        username,
        email
    }
}

// 定义重置密码的验证规则
const update_password_schema = {
    body: {
        // 使用password的验证规则
        oldPwd: password,
        //与旧密码不同
        newPwd: joi.not(joi.ref('oldPwd')).concat(password)
    }
}




export { reg_login_schema, update_userInfo_schema, update_password_schema }