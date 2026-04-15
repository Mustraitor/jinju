 初始化Live2D模型
let app, model;
function initLive2D() {
    app = new PIXI.Application({
        view: document.getElementById('live2d-canvas'),
        transparent: true,
        autoStart: true,
        resizeTo: document.getElementById('live2d-container')
    });
    
    // 加载Live2D模型 - 这里使用示例模型，实际应替换为晋剧角色模型
    model = PIXI.live2d.Live2DModel.from('丛雨live2d第二版（新增表情）/Murasame.model3.json');
    model.anchor.set(0.5, 0.5);
    model.position.set(app.screen.width / 2, app.screen.height / 2);
    model.scale.set(0.8);
    app.stage.addChild(model);
    
    // 添加点击交互
    model.on('hit', (hitAreas) => {
        if (hitAreas.includes('body')) {
            addDialogMessage('晋剧AI', '哎呀，别碰那里~', true);
        }
    });
}

// 对话功能
const dialogContent = document.getElementById('dialog-content');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const logBtn = document.getElementById('log-btn');
const logModal = document.getElementById('log-modal');
const logContent = document.getElementById('log-content');
const closeLog = document.getElementById('close-log');
const voiceBtn = document.getElementById('voice-btn');

let dialogHistory = [];

function addDialogMessage(speaker, message, isAI = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `bg-black bg-opacity-50 p-3 rounded-lg fade-in ${isAI ? 'ai-message' : 'user-message'}`;
    
    const speakerSpan = document.createElement('span');
    speakerSpan.className = 'font-bold text-yellow-300 jq-font';
    speakerSpan.textContent = `【${speaker}】`;
    
    const messageP = document.createElement('p');
    messageP.className = isAI ? 'text-yellow-100 jq-font' : 'text-white';
    messageP.textContent = message;
    
    messageDiv.appendChild(speakerSpan);
    messageDiv.appendChild(messageP);
    dialogContent.appendChild(messageDiv);
    
    // 添加到对话历史
    dialogHistory.push({speaker, message, timestamp: new Date()});
    
    // 自动滚动到底部
    dialogContent.parentElement.scrollTop = dialogContent.parentElement.scrollHeight;
}

function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        addDialogMessage('您', message);
        userInput.value = '';
        
        // 模拟AI回复
        setTimeout(() => {
            const responses = [
                "晋剧，又称山西梆子，是中国北方重要的戏曲剧种之一。",
                "您知道吗？晋剧的传统剧目有《打金枝》、《算粮》等经典作品。",
                "晋剧的唱腔高亢激昂，表演朴实粗犷，具有浓郁的地方特色。",
                "想了解更多关于晋剧的历史吗？我可以为您详细介绍。",
                "晋剧的服饰华丽精美，脸谱也很有特色，您对哪方面感兴趣呢？"
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            addDialogMessage('晋剧AI', randomResponse, true);
            
            // Live2D模型动作
            if (model) {
                model.motion('tap_body');
            }
        }, 1000);
    }
}

// 事件监听
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

logBtn.addEventListener('click', () => {
    logContent.innerHTML = '';
    dialogHistory.forEach(item => {
        const logItem = document.createElement('div');
        logItem.className = 'mb-3 pb-3 border-b border-gray-700';
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'text-gray-400 text-sm';
        timeSpan.textContent = item.timestamp.toLocaleTimeString();
        
        const speakerSpan = document.createElement('span');
        speakerSpan.className = 'font-bold text-yellow-300 mr-2 jq-font';
        speakerSpan.textContent = `【${item.speaker}】`;
        
        const messageP = document.createElement('p');
        messageP.className = 'text-white';
        messageP.textContent = item.message;
        
        logItem.appendChild(timeSpan);
        logItem.appendChild(speakerSpan);
        logItem.appendChild(messageP);
        logContent.appendChild(logItem);
    });
    logModal.classList.remove('hidden');
});

closeLog.addEventListener('click', () => {
    logModal.classList.add('hidden');
});

voiceBtn.addEventListener('click', () => {
    // 语音功能占位
    alert('语音功能将在后续版本中实现');
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initLive2D();
    // 预加载一些晋剧知识
    setTimeout(() => {
        addDialogMessage('晋剧AI', '您知道吗？晋剧在2006年被列入国家级非物质文化遗产名录。', true);
    }, 2000);
});
