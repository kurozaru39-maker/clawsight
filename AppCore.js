// ==========================================
// ClawSight v6.0 - AppCore.js
// 状態管理とイベントバインディングの中枢
// ==========================================

// 1. グローバルステート（アプリの現在の状態）
const state = {
    mode: 'PUSH',   // 'PUSH' または 'HOOK'
    power: 'LOW',   // 'LOW' (渋い) または 'HIGH' (強力)
    isAnimating: false,
    isFallen: false
};

// 2. DOM要素の取得
const btnPush = document.getElementById('btn-push');
const btnHook = document.getElementById('btn-hook');
const btnPowerLow = document.getElementById('btn-power-low');
const btnPowerHigh = document.getElementById('btn-power-high');
const statusText = document.getElementById('status');

const btnReset = document.getElementById('btn-reset');
const btnAiNav = document.getElementById('btn-ai-nav');
const btnDrop = document.getElementById('btn-drop');

// 3. UI更新ロジック
function updateModeUI() {
    btnPush.classList.toggle('active', state.mode === 'PUSH');
    btnHook.classList.toggle('active', state.mode === 'HOOK');
    updateStatusMessage();
}

function updatePowerUI() {
    btnPowerLow.classList.toggle('active', state.power === 'LOW');
    btnPowerHigh.classList.toggle('active', state.power === 'HIGH');
    updateStatusMessage();
}

function updateStatusMessage() {
    if (state.isAnimating) return;
    const modeText = state.mode === 'PUSH' ? "上面PUSH" : "下側HOOK";
    const powerText = state.power === 'LOW' ? "弱設定" : "強設定";
    statusText.innerText = `Status: ${modeText} [${powerText}] - 準備完了`;
}

// 4. イベントリスナーの登録
function bindEvents() {
    // モード切替
    btnPush.addEventListener('click', () => {
        if (state.isAnimating) return;
        state.mode = 'PUSH';
        updateModeUI();
    });

    btnHook.addEventListener('click', () => {
        if (state.isAnimating) return;
        state.mode = 'HOOK';
        updateModeUI();
    });

    // パワー切替
    btnPowerLow.addEventListener('click', () => {
        if (state.isAnimating) return;
        state.power = 'LOW';
        updatePowerUI();
    });

    btnPowerHigh.addEventListener('click', () => {
        if (state.isAnimating) return;
        state.power = 'HIGH';
        updatePowerUI();
    });

    // アクションボタン
    btnReset.addEventListener('click', () => {
        console.log("[AppCore] RESET triggered");
        state.isAnimating = false;
        state.isFallen = false;
        statusText.innerText = "Status: システムリセット完了";
        statusText.style.color = "#00ffcc";
        // TODO: PhysicsEngine.reset() や Renderer.reset() を呼ぶ
    });

    btnAiNav.addEventListener('click', () => {
        if (state.isFallen || state.isAnimating) return;
        console.log("[AppCore] AI NAVI triggered");
        statusText.innerText = "🤖 AI NAVI: 最適解を投影中...";
        // TODO: AINavigator.compute() を呼ぶ
    });

    btnDrop.addEventListener('click', () => {
        if (state.isFallen || state.isAnimating) return;
        console.log("[AppCore] ACTION triggered");
        state.isAnimating = true;
        statusText.innerText = "Status: 物理演算エンジン稼働中...";
        // TODO: PhysicsEngine.execute(state.mode, state.power) を呼ぶ
    });
}

// 5. 初期化処理
function init() {
    console.log("ClawSight AppCore Initialized.");
    bindEvents();
    updateStatusMessage();
}

// アプリ起動
init();
