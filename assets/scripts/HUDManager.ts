import { _decorator, Component, Label, director, Node, Vec3 } from 'cc';
import { NetManager } from './NetManager';
import { GlobalData } from './GlobalData';
const { ccclass, property } = _decorator;

@ccclass('HUDManager')
export class HUDManager extends Component {
    @property(Label) nameLabel: Label = null;
    @property(Label) goldLabel: Label = null;
    @property(Label) levelLabel: Label = null;
    @property(Label) reputationLabel: Label = null;
    @property(Label) locationLabel: Label = null;

    private readonly MAP_NAMES: Record<string, string> = {
        "clinic_interior": "医馆内堂",
        "village_entrance": "杏花村口",
        "back_mountain": "后山药林",
        "market_street": "集市街口"
    };

    private playerId: string = "";

    onLoad() {
        this.playerId = localStorage.getItem("current_player_id");
        if (!this.playerId) {
            director.loadScene("SelectSave");
            return;
        }

        // --- 【关键修改】注册全局事件监听 ---
        // 只要有人调用了 director.emit("UPDATE_PLAYER_HUD", ...)，这里就会触发
        director.on("UPDATE_PLAYER_HUD", this.handleDataUpdate, this);

        this.setLoadingState();
    }

    onDestroy() {
        // --- 【关键修改】组件销毁时记得移除监听，防止报错 ---
        director.off("UPDATE_PLAYER_HUD", this.handleDataUpdate, this);
    }

    /**
     * 事件回调函数
     */
    private handleDataUpdate(newData: any) {
        console.log("HUD 监听到数据更新:", newData);
        this.updateUI(newData);
    }

    async start() {
        await this.initGameConfig();
        await this.refreshPlayerData();
    }

    async initGameConfig() {
        try {
            const items = await NetManager.getInstance().get("/item");
            GlobalData.itemConfigs = items;
        } catch (err) {
            console.error("加载物品配置失败");
        }
    }

    private setLoadingState() {
        this.nameLabel.string = "载入中...";
        this.goldLabel.string = "---";
        this.locationLabel.string = "正在定位...";
    }

    /**
     * 初始进入或手动刷新时调用：从网络拉取
     */
    async refreshPlayerData() {
        try {
            const data = await NetManager.getInstance().get(`/player/${this.playerId}`);
            GlobalData.playerData = data;
            this.updateUI(data);
        } catch (e) {
            console.error("获取玩家数据失败", e);
        }
    }

    /**
     * 核心 UI 渲染函数
     */
    private updateUI(data: any) {
        if (!data) return;

        this.nameLabel.string = data.nickname || "未知";
        this.goldLabel.string = `金币: ${data.gold}`;
        this.levelLabel.string = `等级: ${data.level}`;
        this.reputationLabel.string = `声望: ${data.reputation}`;

        const pos = data.lastPosition;
        const mapId = pos?.mapId || "clinic_interior";
        const mapName = this.MAP_NAMES[mapId] || mapId;
        const posX = Math.floor(pos?.x || 0);
        const posY = Math.floor(pos?.y || 0);
        this.locationLabel.string = `${mapName} (X: ${posX}, Y: ${posY})`;
    }
}