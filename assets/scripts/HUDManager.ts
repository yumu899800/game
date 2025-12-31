import { _decorator, Component, Node, Prefab, instantiate, Label, UITransform, Layout, Color } from 'cc';
const { ccclass, property } = _decorator;

/**
 * HUD 管理器：负责背包界面的刷新与查表显示
 */
@ccclass('HUDManager')
export class HUDManager extends Component {

    @property(Node)
    bagPanel: Node = null; // 背包主面板

    @property(Node)
    bagContent: Node = null; // ScrollView 的 Content 节点

    @property(Prefab)
    itemPrefab: Prefab = null; // 物品条目预制体

    // 模拟玩家存档数据（itemId 需与 JSON 中的对应）
    private playerInventory = [
        { itemId: "herb_gancao", count: 5 },
        { itemId: "herb_mahuang", count: 2 },
        { itemId: "herb_renshen", count: 1 },
        { itemId: "seed_gancao", count: 10 },
        { itemId: "mystery_seed", count: 1 }
    ];

    // 假设这是从服务器/本地加载进来的物品配置表
    private itemListConfig = [];

    start() {
        if (this.bagPanel) this.bagPanel.active = false;

        // 1. 获取 SaveManager 中的配置表数据
        // 注意：这里需要根据你的项目实际单例写法来获取，假设叫 SaveManager.instance.itemList
        // 这里暂时模拟赋值为你提供的 JSON 数据
        this.itemListConfig = [
            { "itemId": "herb_gancao", "name": "甘草" },
            { "itemId": "herb_mahuang", "name": "麻黄" },
            { "itemId": "herb_renshen", "name": "人参" },
            { "itemId": "seed_gancao", "name": "甘草种子" },
            { "itemId": "mystery_seed", "name": "神秘种子" }
        ];

        this.fixUIStructure();
    }

    /**
     * 自动修复 UI 布局，解决高度不增长和滑动条失效
     */
    private fixUIStructure() {
        if (!this.bagContent) return;

        const uiTrans = this.bagContent.getComponent(UITransform);
        if (uiTrans) uiTrans.setAnchorPoint(0.5, 1); // 顶部对齐

        let layout = this.bagContent.getComponent(Layout);
        if (!layout) layout = this.bagContent.addComponent(Layout);

        layout.type = Layout.Type.VERTICAL;
        layout.resizeMode = Layout.ResizeMode.CONTAINER; // 自动撑开高度
        layout.spacingY = 15;
    }

    public toggleBag() {
        if (!this.bagPanel) return;
        this.bagPanel.active = !this.bagPanel.active;

        if (this.bagPanel.active) {
            this.refreshBagUI();
        }
    }

    /**
     * 刷新背包：增加“查表获取中文名”逻辑
     */
    public refreshBagUI() {
        if (!this.bagContent || !this.itemPrefab) return;

        this.bagContent.removeAllChildren();

        this.playerInventory.forEach(invData => {
            const node = instantiate(this.itemPrefab);
            node.parent = this.bagContent;

            // 【核心修复】在配置表中根据 ID 查找名字
            const itemInfo = this.itemListConfig.find(config => config.itemId === invData.itemId);

            const nameLabel = node.getChildByName("ItemName")?.getComponent(Label);
            const countLabel = node.getChildByName("CountLable")?.getComponent(Label);

            if (nameLabel) {
                // 如果查到了就显示“中文名”，查不到就显示“ID”兜底
                nameLabel.string = itemInfo ? itemInfo.name : invData.itemId;
                nameLabel.color = Color.WHITE; // 确保是白字
            }

            if (countLabel) {
                countLabel.string = `x${invData.count}`;
                countLabel.color = new Color(255, 235, 59); // 亮黄色
            }
        });

        // 强制刷新，解决滑动条不及时出现的问题
        this.bagContent.getComponent(Layout)?.updateLayout();
    }
}