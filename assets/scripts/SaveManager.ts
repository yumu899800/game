import { _decorator, Component, Node, Label, Prefab, instantiate, EditBox, director, Button, Color, Sprite } from 'cc';
import { NetManager } from './NetManager';
const { ccclass, property } = _decorator;

@ccclass('SaveManager')
export class SaveManager extends Component {
    @property(Node) saveListLayout: Node = null!;
    @property(Prefab) saveItemPrefab: Prefab = null!;

    @property(Node) createPanel: Node = null!;
    @property(EditBox) nicknameInput: EditBox = null!;
    @property(Label) tipsLabel: Label = null!;

    @property(Button) confirmBtn: Button = null!;
    @property(Button) deleteBtn: Button = null!;

    private selectedPlayerId: string = "";
    private currentSavesCount: number = 0;

    // --- 新增：解决 TS2339 报错的静态成员 ---
    public static itemList: any[] = []; // 全局物品配置表

    /**
     * 获取所有物品配置 (对应数据库 Items 集合)
     */
    public static async fetchAllItems() {
        try {
            // 请求后端获取静态物品数据
            const items = await NetManager.getInstance().get("/item");
            SaveManager.itemList = items;
            console.log("物品配置表同步成功:", SaveManager.itemList.length);
        } catch (err) {
            console.error("加载物品配置失败:", err);
        }
    }
    // -------------------------------------------------------

    start() {
        if (this.createPanel) this.createPanel.active = false;
        if (this.confirmBtn) this.confirmBtn.interactable = false;
        this.refreshSaveList();
    }

    async refreshSaveList() {
        try {
            this.tipsLabel.string = "正在加载存档...";
            const saves = await NetManager.getInstance().get("/player/list-saves");

            this.currentSavesCount = saves.length;
            this.renderSaves(saves);

            this.tipsLabel.string = `已有存档: ${this.currentSavesCount}/6`;

            if (!this.selectedPlayerId) {
                this.confirmBtn.interactable = false;
                this.deleteBtn.interactable = false;
            }
        } catch (err) {
            this.tipsLabel.string = "加载失败";
        }
    }

    renderSaves(saves: any[]) {
        if (!this.saveListLayout) return;
        this.saveListLayout.removeAllChildren();
        if (!saves || !Array.isArray(saves)) return;

        saves.forEach(data => {
            const item = instantiate(this.saveItemPrefab);
            item.parent = this.saveListLayout;

            const nameNode = item.getChildByName("NameLabel");
            if (nameNode) {
                const label = nameNode.getComponent(Label);
                if (label) label.string = data.nickname || "无名氏";
            }

            const infoNode = item.getChildByName("InfoLabel");
            if (infoNode) {
                const label = infoNode.getComponent(Label);
                if (label) label.string = `等级: ${data.level}  金币: ${data.gold}`;
            }

            item.on(Node.EventType.TOUCH_END, () => {
                this.onSelectSave(data._id, item);
            });
        });
    }

    onSelectSave(playerId: string, itemNode: Node) {
        this.selectedPlayerId = playerId;
        this.confirmBtn.interactable = true;
        this.deleteBtn.interactable = true;

        this.saveListLayout.children.forEach(child => {
            const sprite = child.getComponent(Sprite);
            if (sprite) sprite.color = Color.WHITE;
        });
        const selectedSprite = itemNode.getComponent(Sprite);
        if (selectedSprite) selectedSprite.color = Color.YELLOW;
    }

    onOpenCreatePanel() {
        if (this.currentSavesCount >= 6) {
            this.tipsLabel.string = "存档已满(上限6个)";
            return;
        }
        this.createPanel.active = true;
    }

    async onSubmitCreate() {
        const nickname = this.nicknameInput.string;
        if (!nickname) return;
        try {
            await NetManager.getInstance().post("/player/create-save", { nickname });
            this.createPanel.active = false;
            this.refreshSaveList();
        } catch (err: any) {
            this.tipsLabel.string = "创建失败: " + err.message;
        }
    }

    onConfirmEnter() {
        if (!this.selectedPlayerId) return;
        localStorage.setItem("current_player_id", this.selectedPlayerId);
        this.tipsLabel.string = "正在进入医馆...";
        director.loadScene("MainGameScene"); // 对应主游戏场景
    }

    onCloseCreatePanel() {
        this.createPanel.active = false;
        this.nicknameInput.string = "";
    }

    async onDeleteSelectedSave() {
        if (!this.selectedPlayerId) return;
        const confirm = window.confirm("确定要永久删除这个存档吗？");
        if (!confirm) return;

        this.tipsLabel.string = "正在删除...";
        try {
            await NetManager.getInstance().post("/player/delete-save", { playerId: this.selectedPlayerId });
            this.selectedPlayerId = "";
            this.confirmBtn.interactable = false;
            this.deleteBtn.interactable = false;
            await this.refreshSaveList();
        } catch (err: any) {
            this.tipsLabel.string = "删除失败: " + (err.message || "未知错误");
        }
    }
}