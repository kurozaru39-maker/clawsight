// ==========================================
// ClawSight v6.0 - Renderer.js
// 戦術HUD・超軽量レンダリングエンジン
// ==========================================

export const Renderer = {
    canvas: null,
    ctx: null,
    dpr: 1, // Device Pixel Ratio
    
    // 描画設定（サイバーパンクHUD風カラーパレット）
    colors: {
        bg: '#0b0b0b',
        bar: '#444444',
        boxFill: 'rgba(0, 255, 204, 0.15)',
        boxStroke: '#00ffcc',
        comMarker: '#ff0055',
        armPoint: '#ff3366',
        ghostFill: 'rgba(255, 255, 255, 0.05)',
        ghostStroke: 'rgba(255, 255, 255, 0.4)'
    },

    // 初期化とRetinaディスプレイ対応
    init(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        
        // iPhone 13等の高DPIディスプレイでボヤけないためのハック
        this.dpr = window.devicePixelRatio || 1;
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        console.log(`[Renderer] Initialized with DPR: ${this.dpr}`);
    },

    resize() {
        // コンテナのサイズに合わせてCanvasの論理サイズと物理サイズを調整
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const size = Math.min(rect.width * 0.95, window.innerHeight * 0.5); // 画面に収まる正方形ベース
        
        this.canvas.style.width = `${size}px`;
        this.canvas.style.height = `${size}px`;
        
        this.canvas.width = size * this.dpr;
        this.canvas.height = size * this.dpr;
        
        // 座標系を中央原点 (0,0) にスケール調整
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, (size * this.dpr) / 2, (size * this.dpr) / 2);
    },

    // 毎フレーム呼ばれるメインの描画ループ
    draw(physicsState, physicsConfig, cursor, aiNavData = null) {
        // 画面クリア（漆黒の背景）
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        // スケール定数（物理演算の数値をピクセルに変換）
        const scale = 40; 

        // 1. バーの描画（末広がり対応）
        this.drawBars(physicsConfig, scale);

        // 2. AIナビ・ゴースト（最適解）の描画
        if (aiNavData && aiNavData.visible) {
            this.drawBox(aiNavData.x, aiNavData.z, aiNavData.rotX, aiNavData.rotZ, scale, true);
        }

        // 3. プライズ箱（現在状態）の描画
        this.drawBox(physicsState.x, physicsState.z, physicsState.rotX, physicsState.rotZ, scale, false);
        this.drawCenterOfMass(physicsState, scale);

        // 4. アーム（2点爪）の照準描画
        if (cursor) {
            this.drawArmCursor(cursor, scale);
        }
    },

    drawBars(config, scale) {
        this.ctx.strokeStyle = this.colors.bar;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';

        const baseZ = config.barBaseZ * scale;
        // 末広がり設定のハック：奥は狭く、手前は広く描画する
        const flare = config.gapMode === 'WIDE' ? 20 : (config.gapMode === 'TIGHT' ? -10 : 0);

        this.ctx.beginPath();
        // 奥のバー (Zのマイナス方向が奥と仮定)
        this.ctx.moveTo(-150, -baseZ + flare);
        this.ctx.lineTo(150, -baseZ + flare);
        // 手前のバー
        this.ctx.moveTo(-150, baseZ - flare);
        this.ctx.lineTo(150, baseZ - flare);
        this.ctx.stroke();
    },

    drawBox(x, z, rotX, rotZ, scale, isGhost) {
        this.ctx.save();
        // 物理座標(x, z)をCanvas座標(X, Y)へマッピング
        this.ctx.translate(x * scale, z * scale);
        // rotZを2D上の回転として扱う
        this.ctx.rotate(rotZ); 

        // 箱のサイズ設定
        const boxW = 2.2 * scale;
        const boxH = 3.8 * scale; // 奥行きを縦幅として描画

        if (isGhost) {
            this.ctx.fillStyle = this.colors.ghostFill;
            this.ctx.strokeStyle = this.colors.ghostStroke;
            this.ctx.setLineDash([5, 5]); // ワイヤーフレーム風の破線
        } else {
            this.ctx.fillStyle = this.colors.boxFill;
            this.ctx.strokeStyle = this.colors.boxStroke;
        }

        this.ctx.lineWidth = 2;
        this.ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
        this.ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);
        
        this.ctx.restore();
    },

    drawCenterOfMass(state, scale) {
        this.ctx.save();
        this.ctx.translate(state.x * scale, state.z * scale);
        this.ctx.rotate(state.rotZ);

        this.ctx.fillStyle = this.colors.comMarker;
        this.ctx.beginPath();
        this.ctx.arc(state.comX * scale, state.comZ * scale, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    },

    drawArmCursor(cursor, scale) {
        const span = 1.2 * scale; // 爪の間隔
        const cx = cursor.x * scale;
        const cz = cursor.z * scale;

        this.ctx.fillStyle = this.colors.bg;
        this.ctx.strokeStyle = this.colors.armPoint;
        this.ctx.lineWidth = 2;

        // 左爪
        this.ctx.beginPath();
        this.ctx.arc(cx - span / 2, cz, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // 右爪
        this.ctx.beginPath();
        this.ctx.arc(cx + span / 2, cz, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // ユニットを繋ぐライン
        this.ctx.beginPath();
        this.ctx.moveTo(cx - span / 2 + 6, cz);
        this.ctx.lineTo(cx + span / 2 - 6, cz);
        this.ctx.stroke();
    }
};
