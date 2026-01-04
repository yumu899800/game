import { _decorator, Component, Node, Prefab, instantiate, Label, director } from 'cc';
import { NetManager } from './NetManager';
import { GlobalData } from './GlobalData';
// 不需要再 import HUDManager，降低了耦合
import { GoodsEntryUI } from './GoodsEntryUI';
const { ccclass, property } = _decorator;

@ccclass('MarketManager')
export class MarketManager extends Component {
    @property(Node) marketPanel: Node = null;
    @property(Node) goodsContent: Node = null;
    @property(Prefab) goodsPrefab: Prefab = null;
    @property(Label) shopTitleLabel: Label = null;

    onLoad() {
        if (this.marketPanel) this.marketPanel.active = false;
    }

    async openShop(event: any, shopId: string) {
        this.marketPanel.active = true;
        this.goodsContent.removeAllChildren();
        this.shopTitleLabel.string = "正在开启店门...";

        try {
            const shopDetail = await NetManager.getInstance().get(`/market/shops?shopId=${shopId}`);
            this.shopTitleLabel.string = shopDetail.shopName;

            shopDetail.goods.forEach(item => {
                this.createGoodsEntry(item);
            });
        } catch (e) {
            this.shopTitleLabel.string = "暂未营业";
        }
    }

    private createGoodsEntry(item: any) {
        const node = instantiate(this.goodsPrefab);
        node.parent = this.goodsContent;
        const goodsUI = node.getComponent("GoodsEntryUI") as any; 
        
        if (goodsUI) {
            goodsUI.init(item, (itemId: string) => {
                this.onBuyRequest(itemId, 1);
            });
        }
    }

    /**
     * 发送购买请求并通知全局刷新
     */
    async onBuyRequest(itemId: string, count: number) {
        const playerId = localStorage.getItem("current_player_id");
        try {
            // 1. 发起网络请求
            const res = await NetManager.getInstance().post("/market/buy", {
                playerId,
                itemId,
                count
            });

            // 2. 更新全局数据缓存
            GlobalData.playerData = res; 

            // 3. 【关键修改】发送全局事件，通知所有监听者（如 HUD）数据已更新
            // 这里的 "UPDATE_PLAYER_HUD" 是自定义的消息名，res 是服务器返回的最新的玩家数据
            director.emit("UPDATE_PLAYER_HUD", res);

            console.log("购买成功，已派发 UI 刷新消息");
            
        } catch (e) {
            alert(`购买失败: ${e.message}`);
        }
    }

    close() {
        this.marketPanel.active = false;
    }
}