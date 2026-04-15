<template>
  <div class="admin-layout">
    <el-container style="height: 100vh;">
      <el-aside width="220px" class="aside-menu">
        <div class="admin-logo">晋韵智传-后台</div>
        <el-menu 
          :default-active="activeMenu" 
          background-color="#304156" 
          text-color="#fff"
          @select="handleMenuSelect"
        >

          <el-menu-item index="3">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="2">
            <el-icon><UploadFilled /></el-icon>
            <span>知识图谱管理</span>
          </el-menu-item>
          <el-menu-item index="1">
            <el-icon><DataBoard /></el-icon>
            <span>晋剧视频管理</span>
          </el-menu-item>

        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="admin-header">
          <div class="header-left"></div>
            <div class="header-right">
              <el-tag effect="dark" type="danger" style="margin-right: 15px;">管理员模式</el-tag>
              <el-dropdown @command="handleCommand">
                <div class="avatar-wrapper" style="cursor: pointer; outline: none;">
                  <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                </div>
                <template #dropdown> <el-dropdown-menu>
                    <el-dropdown-item command="logout" style="color: #f56c6c;">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
        </el-header>

        <el-main class="admin-main">
          <!-- 视频管理 -->
          <el-card v-if="activeMenu === '1'" class="video-asset-card">
            <template #header>
              <div class="card-header">
                <div class="header-left">
                  <el-icon :size="20" style="vertical-align: middle; margin-right: 8px; color: #409eff;">
                    <VideoCamera />
                  </el-icon>
                  <span class="header-title"></span>
                </div>
                <el-button type="danger" @click="handleSyncVideos" :loading="videoLoading" plain>
                  <el-icon style="margin-right: 4px;"><Refresh /></el-icon> 扫描服务器并重构索引
                </el-button>
              </div>
            </template>

          <el-table 
            :data="videoList" 
            v-loading="videoLoading" 
            stripe 
            style="width: 100%;" 
            max-height="500"
          >
            <el-table-column label="封面预览" width="160" align="center">
              <template #default="scope">
                <el-image 
                  :src="getImageUrl(scope.row.cover_url)" 
                  :preview-src-list="[getImageUrl(scope.row.cover_url)]"
                  :initial-index="0"
                  fit="cover" 
                  class="video-cover"
                  style="width: 120px; height: 80px; border-radius: 4px; cursor: pointer;"
                  preview-teleported
                >
                  <template #error>
                    <div class="image-slot" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #909399; font-size: 12px;">
                      加载失败
                    </div>
                  </template>
                </el-image>
              </template>
            </el-table-column>

            <el-table-column prop="title" label="剧目名称" min-width="200">
              <template #default="scope">
                <div style="font-weight: bold; color: #333;">{{ scope.row.title }}</div>
                <div style="font-size: 12px; color: #999; margin-top: 4px;">
                  <span>{{ scope.row.description || '暂无描述' }}</span>
                </div>
              </template>
            </el-table-column>

            <!-- <el-table-column label="操作" width="150" align="center">
              <template #default="scope">
                <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
                <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column> -->
          </el-table>
          </el-card>
          <!-- 知识图谱管理 -->
          <el-card v-if="activeMenu === '2'" class="import-card">
            <template #header>
              <div class="card-header">
                <span>非遗知识图谱 - 自动化同步中枢</span>
              </div>
            </template>
            <div class="upload-section">
              <el-upload
                class="upload-demo"
                drag
                action="#" 
                :auto-upload="false"
                :on-change="handleFileChange"
                accept=".xlsx, .xls"
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">将《晋剧知识.xlsx》拖到此处，或<em>点击上传</em></div>
              </el-upload>
            </div>
            <el-button type="primary" @click="submitUpload" :loading="syncLoading" style="margin-top: 20px">
                开始解析并同步到数据库
            </el-button>
          </el-card>
          <!-- 用户管理 -->
          <el-card v-if="activeMenu === '3'" class="user-card">
            <template #header>
              <div class="card-header">
                <span>平台用户管理</span>
                <el-button type="primary" size="small" @click="addDialogVisible = true">新增账号</el-button>
              </div>
            </template>
            <el-table :data="mockUsers" stripe style="width: 100%">
              <el-table-column prop="id" label="UID" width="80" />
              <el-table-column label="头像" width="80">
                <template #default="scope">
                  <el-avatar :size="30" :src="scope.row.user_pic || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
                </template>
              </el-table-column>
              <el-table-column prop="username" label="用户名" />
              <el-table-column label="身份标识">
                <template #default="scope">
                  <el-select 
                    v-model="scope.row.user_type" 
                    size="small"
                    style="width: 120px;"
                    @change="(val) => handleRoleChange(scope.row.id, val)"
                  >
                    <el-option label="普通研究员" :value="0" />
                    <el-option label="系统管理员" :value="1" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180">
                <template #default="scope">
                  <el-button size="small" link type="primary">编辑</el-button>
                  <el-button 
                    v-if="scope.row.user_type === 0"
                    size="small" 
                    link 
                    type="danger" 
                    @click="handleDeleteUser(scope.row)"
                  >删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
          <!-- 添加用户弹窗 -->
          <el-dialog v-model="addDialogVisible" title="添加用户" width="30%" @close="resetAddForm">
            <el-form :model="addUserForm" :rules="addRules" ref="addUserRef" label-width="80px">
              <el-form-item label="用户名" prop="username">
                <el-input v-model="addUserForm.username" placeholder="请输入登录账号" />
              </el-form-item>
              <el-form-item label="初始密码" prop="password">
                <el-input v-model="addUserForm.password" type="password" show-password placeholder="建议6位以上" />
              </el-form-item>
              <el-form-item label="身份权限">
                <el-select v-model="addUserForm.user_type" placeholder="请选择">
                  <el-option label="普通研究员" :value="0" />
                  <el-option label="系统管理员" :value="1" />
                </el-select>
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="addDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="submitAddUser" :loading="submitLoading">确认创建</el-button>
            </template>
          </el-dialog>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '@/api/admin'
import { videoApi } from '@/api/video'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataBoard, UploadFilled, User, VideoCamera, Refresh } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

// 获取环境变量中的 API 地址
const baseURL = import.meta.env.VITE_APP_API_URL || '';

const getImageUrl = (url) => {
  if (!url) return '';
  // 如果数据库存的是 /covers/xxx.jpg，我们需要拼接上域名
  // encodeURI 会处理中文和中括号，但不会破坏 / 和 :
  return encodeURI(`${baseURL}${url}`);
};


const userStore = useUserStore()
const activeMenu = ref('1') // 默认显示数据大屏
const mockUsers = ref([])


// 模拟你提供的数据
const fetchUserList = async () => {
  try {
    const res = await adminApi.getAllUsers()
    if (res.status === 0) {
      mockUsers.value = res.data // 将后端真实数据赋值给列表
    } else {
      ElMessage.error(res.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户异常:', error)
  }
}

const handleMenuSelect = (index) => {
  activeMenu.value = index
  if (index === '3') {
    fetchUserList()
  }
}

// 控制弹窗显示
const addDialogVisible = ref(false)
const submitLoading = ref(false)
const addUserRef = ref(null)

// 表单数据绑定
const addUserForm = reactive({
  username: '',
  password: '',
  user_type: 0
})

// 表单校验规则 (写进报告：增强系统鲁棒性)
const addRules = {
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 3, max: 10, message: '长度在 3 到 10 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ]
}

const resetAddForm = () => {
  if (addUserRef.value) {
    // 抹除输入内容 + 抹除红色校验提示
    addUserRef.value.resetFields() 
  }
}
// 提交新增用户
const submitAddUser = async () => {
  if (!addUserRef.value) return
  
  // 1. 表单预校验
  await addUserRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const res = await adminApi.addUser(addUserForm)
        if (res.status === 0) {
          ElMessage.success('账号创建成功！')
          addDialogVisible.value = false
          // 重置表单并刷新列表
          addUserRef.value.resetFields()
          fetchUserList() 
        } else {
          ElMessage.error(res.message)
        }
      } catch (err) {
        ElMessage.error('服务异常')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDeleteUser = (row) => {
  ElMessageBox.confirm(
    `确定要从系统中删除用户 "${row.username}" 吗？该操作将移除其访问权限。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error', // 使用 error 类型图标，视觉提醒更强
      confirmButtonClass: 'el-button--danger'
    }
  )
    .then(async () => {
      try {
        // 调用逻辑删除接口
        const res = await adminApi.deleteUser(row.id)
        if (res.status === 0) {
          ElMessage({
            type: 'success',
            message: '用户已成功移除'
          })
          // 刷新当前列表
          fetchUserList()
        } else {
          ElMessage.error(res.message || '删除失败')
        }
      } catch (err) {
        console.error('删除操作异常:', err)
        ElMessage.error('网络请求失败')
      }
    })
    .catch(() => {
      // 用户点击取消，不做任何处理
    })
}

const handleRoleChange = async (id, newRole) => {
  try {
    // 调用之前在 adminApi 里补全的 updateUserRole
    const res = await adminApi.updateUserRole(id, newRole)
    
    if (res.status === 0) {
      ElMessage.success('身份权限更新成功')
      // 可选：重新拉取列表以确保状态同步
      // fetchUserList() 
    } else {
      ElMessage.error(res.message || '更新失败')
      // 如果失败了，建议重新拉取列表回滚前端显示的状态
      fetchUserList()
    }
  } catch (err) {
    console.error('修改权限异常:', err)
    ElMessage.error('网络请求失败，权限未变更')
    fetchUserList()
  }
}

const router = useRouter()

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定退出晋韵智传管理系统吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }).then(() => {
      // 1. 调用你 store 里的登出
      userStore.logout() 
      // 2. 提示并跳转
      ElMessage.success('安全退出成功')
      router.push('/login') 
    }).catch(() => {})
  }
}

const syncLoading = ref(false)
const fileList = ref([])

const handleFileChange = (file) => {
  fileList.value = [file.raw]
}

const submitUpload = async () => {
  console.log('按钮被点击了，当前文件列表：', fileList.value)
  if (fileList.value.length === 0) return ElMessage.warning('请先选择文件')
  
  const formData = new FormData()
  formData.append('file', fileList.value[0])

  syncLoading.value = true
  try {
    // 调用 adminApi 里的接口
    // console.log('1. 即将调用接口')
    const res = await adminApi.importGraphData(formData)
    // console.log('2. 接口调用回来了', res)
    if (res.status === 0) {
      ElMessage.success(`同步完成！共导入 ${res.total} 条数据`)
    }
  } finally {
    syncLoading.value = false
  }
}


const videoList = ref([])
const videoLoading = ref(false)

// 加载视频数据的方法
const fetchVideoData = async () => {
  videoLoading.value = true
  try {
    const res = await videoApi.getVideoList()
    // 注意：这里要改成 res.code，因为你后端返回的是 code
    if (res.code === 0) {
      // 成功获取数据后赋值
      videoList.value = res.data 
    }
  } catch (err) {
    console.error('获取列表失败:', err)
  } finally {
    videoLoading.value = false
  }
}

// 执行一键同步的方法
const handleSyncVideos = async () => {
  try {
    videoLoading.value = true
    const res = await adminApi.syncVideos()
    if (res.status === 0) {
      // 同步成功后，立即调用上面的方法刷新列表数据
      await fetchVideoData() 
      ElMessage.success('服务器视频库已重构完成')
    }
  } catch (err) {
    ElMessage.error('同步异常')
  } finally {
    videoLoading.value = false
  }
}

onMounted(() => {
  fetchVideoData()
})

</script>

<style lang="scss" scoped>
// 定义主题色变量，方便统一修改
$menu-bg: #304156;
$menu-hover: #263445;
$primary-color: #409eff;
$text-white: #fff;
$header-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

.admin-layout {
  background-color: #f0f2f5;
  min-height: 100vh;

  .aside-menu {
    background-color: $menu-bg;
    transition: width 0.3s;
    border-right: none;

    .admin-logo {
      height: 60px;
      line-height: 60px;
      text-align: center;
      color: $primary-color;
      font-weight: bold;
      font-size: 18px;
      background: $menu-hover;
    }

    // 深度作用选择器，修改 Element Plus 菜单样式
    :deep(.el-menu) {
      border-right: none;
      .el-menu-item.is-active {
        background-color: $primary-color !important;
        color: $text-white;
      }
    }
  }

  .admin-header {
    background: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: $header-shadow;
    padding: 0 20px;
    
    .header-right {
      display: flex;
      align-items: center;
    }
  }

  .admin-main {
    padding: 20px;

    .stat-cards {
      margin-bottom: 20px;
      
      .stat-value {
        font-size: 26px;
        font-weight: bold;
        color: $primary-color;
        text-align: center;
        padding: 10px 0;
      }
    }

    .user-card, .import-card {
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      border-radius: 8px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
      }

      .upload-section {
        padding: 30px;
        display: flex;
        justify-content: center;
      }
    }
  }
}
</style>