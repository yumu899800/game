import { _decorator, Component, Label, Sprite, resources, SpriteFrame, Button } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GoodsEntryUI')
export class GoodsEntryUI extends Component {
    @property(Label) nameLabel: Label = null;
    @property(Label) priceLabel: Label = null;
    @property(Label) descLabel: Label = null;
    @property(Sprite) iconSprite: Sprite = null;
    @property(Button) buyBtn: Button = null; 

    private itemId: string = "";
    private buyCallback: (itemId: string) => void = null;

    /**
     * 初始化显示数据和购买回调
     */
    init(itemData: any, onBuyClicked: (itemId: string) => void) {
        this.itemId = itemData.itemId;
        this.buyCallback = onBuyClicked;

        if (this.nameLabel) this.nameLabel.string = itemData.name;
        if (this.priceLabel) this.priceLabel.string = `${itemData.price} 文`;
        if (this.descLabel) this.descLabel.string = itemData.description;

        // 动态加载图标
        if (itemData.iconRes && this.iconSprite) {
            resources.load(`icons/${itemData.iconRes}/spriteFrame`, SpriteFrame, (err, sf) => {
                if (!err) this.iconSprite.spriteFrame = sf;
            });
        }
        if (this.buyBtn) {
            // 先移除所有之前的监听，防止重复触发
            this.buyBtn.node.off(Button.EventType.CLICK); 
            // 绑定点击事件到自身的 onBuyBtnClick 函数
            this.buyBtn.node.on(Button.EventType.CLICK, this.onBuyBtnClick, this);
        }
    }

    /**
     * 绑定到预制体里 BuyBtn 的点击事件
     */
    onBuyBtnClick() {
        console.log("代码绑定触发：点击购买", this.itemId);
        if (this.buyCallback) {
            this.buyCallback(this.itemId);
        }
    }
}