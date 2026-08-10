// ==========================================
// ClawSight v6.0 - PhysicsEngine.js
// 決定論的ピボット演算コア
// ==========================================

export const PhysicsEngine = {
    // 筐体と箱の初期パラメータ（※後々AI動画解析から流し込むデータ）
    config: {
        boxHalfDepth: 1.9,  // 箱の奥行きの半分
        barBaseZ: 1.8,      // 平行時のバーのZ座標（±1.8）
        gapMode: 'NORMAL',  // 'WIDE', 'NORMAL', 'TIGHT'
    },

    // 箱の現在状態
    state: {
        x: 0, z: 0,
        rotX: 0, rotZ: 0,
        comX: (Math.random() - 0.5) * 0.6, // 重心の偏りX
        comZ: (Math.random() - 0.5) * 0.6  // 重心の偏りZ
    },

    // 現在のバーの幅を取得（末広がり対応の基礎）
    getBarZ() {
        if (this.config.gapMode === 'WIDE') return 2.2;
        if (this.config.gapMode === 'TIGHT') return 1.45;
        return 1.8;
    },

    // アクション実行と未来予測の計算
    executeAction(targetX, targetZ, mode, power) {
        console.log(`[PhysicsEngine] 計算開始: モード=${mode}, パワー=${power}`);
        
        const currentBarZ = this.getBarZ();
        const powerMult = power === 'LOW' ? 0.2 : 0.85;

        // 重心とターゲットのズレ（レバレッジ）を計算
        const leverageX = targetX - (this.state.x + this.state.comX);
        const leverageZ = targetZ - (this.state.z + this.state.comZ);

        // 1. 純粋な移動量と回転量の算出（まだバーの制約を受けていない仮の未来位置）
        let nextX = this.state.x + leverageX * (mode === 'PUSH' ? 0.22 : 0.35) * powerMult;
        let nextZ = this.state.z + leverageZ * (mode === 'PUSH' ? 0.28 : 0.45) * powerMult;
        let nextRotX = this.state.rotX + leverageZ * (mode === 'PUSH' ? 0.25 : 0.5) * powerMult;
        let nextRotZ = this.state.rotZ - leverageX * (mode === 'PUSH' ? 0.25 : 0.5) * powerMult;

        // 2. ピボット（支点）制約とアンチ・トンネリング処理
        const frontEdge = nextZ + this.config.boxHalfDepth;
        const backEdge = nextZ - this.config.boxHalfDepth;
        let isFallen = false;

        // 箱がバーを貫通しようとした場合、バーの位置でクランプ（固定）し、回転力に変換する
        if (backEdge < -currentBarZ && backEdge > -currentBarZ - 0.3) {
            // 奥のバーに引っかかった
            nextZ = -currentBarZ + this.config.boxHalfDepth;
            nextRotX += 0.2; // テコの原理でさらに傾く
        } else if (frontEdge > currentBarZ && frontEdge < currentBarZ + 0.3) {
            // 手前のバーに引っかかった
            nextZ = currentBarZ - this.config.boxHalfDepth;
            nextRotX -= 0.2;
        }

        // 3. 落下判定（バーの完全な外側に重心ごと出たか、傾きが限界を超えたか）
        if (nextZ - this.config.boxHalfDepth < -currentBarZ - 0.1 || 
            nextZ + this.config.boxHalfDepth > currentBarZ + 0.1 || 
            Math.abs(nextRotX) > 0.45) {
            isFallen = true;
        }

        // 状態の更新
        this.state.x = nextX;
        this.state.z = nextZ;
        this.state.rotX = nextRotX;
        this.state.rotZ = nextRotZ;

        return {
            finalState: { ...this.state },
            isFallen: isFallen
        };
    },

    reset() {
        this.state = {
            x: 0, z: 0, rotX: 0, rotZ: 0,
            comX: (Math.random() - 0.5) * 0.6,
            comZ: (Math.random() - 0.5) * 0.6
        };
        return { ...this.state };
    }
};
