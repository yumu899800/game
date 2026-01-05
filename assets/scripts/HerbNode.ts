import { _decorator, Component, Node, Collider2D, Contact2DType, Tween, Vec3, Sprite, SpriteFrame, UITransform, Button } from 'cc';
import { NetManager } from './NetManager';
import { GlobalData } from './GlobalData';
const { ccclass, property } = _decorator;

@ccclass('HerbNode')
export class HerbNode extends Component {

    // --- 内部数据 (由管理器动态赋值) ---
    public itemId: string = ""; 
    public herbName: string = "";

    // --- 编辑器绑定属性 ---
    
    @property({ type: Node, tooltip: '拖入当前Prefab里的 UI_Bubble 节点' })
    bubbleNode: Node = null!;

    @property({ type: Sprite, tooltip: '拖入节点自身的 Sprite 组件' })
    displaySprite: Sprite = null!; 

    private isGathering: boolean = false; // 防止连点锁

    /**
     * 【核心方法】初始化药材信息
     * 由 WildSpawnManager 调用
     */
    initInfo(id: string, name: string, spriteFrame: SpriteFrame) {
        this.itemId = id;
        this.herbName = name;
        
        if (this.displaySprite && spriteFrame) {
            // 1. 设置图片纹理
            this.displaySprite.spriteFrame = spriteFrame;

            // 2. 【关键】强制统一图片大小
            // 图片素材可能大小不一，这里强制让它们适应节点大小，而不是让节点适应图片
            this.displaySprite.sizeMode = Sprite.SizeMode.CUSTOM; 
            
            // 3. 设置节点尺寸为 80x80 (你可以根据需要调整这个数值)
            const tf = this.node.getComponent(UITransform);
            if (tf) {
                tf.setContentSize(400, 400);
            }
        }
    }

    start() {
        // 1. 注册物理碰撞事件
        const collider = this.getComponent(Collider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        } else {
            console.error("HerbNode: 缺少 Collider2D 组件，无法触发采集！");
        }

        // 2. 确保气泡一开始是隐藏的
        if (this.bubbleNode) this.bubbleNode.active = false;
    }

    // --- 碰撞检测逻辑 ---

    onBeginContact(self: Collider2D, other: Collider2D) {
        // 调试日志：如果你走过去没反应，看控制台有没有这句话
        // console.log(`[Herb] 撞到了: ${other.node.name}`);

        if (other.node.name === 'Player') {
            // 显示头顶气泡
            if (this.bubbleNode) this.bubbleNode.active = true;
        }
    }

    onEndContact(self: Collider2D, other: Collider2D) {
        if (other.node.name === 'Player') {
            // 隐藏头顶气泡
            if (this.bubbleNode) this.bubbleNode.active = false;
        }
    }

    // --- 采集逻辑 (绑定到 UI_Bubble 下的按钮) ---

    public async onGatherClick() {
        if (this.isGathering) return;
        this.isGathering = true; // 上锁

        console.log(`正在采集: ${this.herbName} (ID: ${this.itemId})`);

        try {
            const playerId = localStorage.getItem("current_player_id");
            if (!playerId) {
                console.warn("未找到玩家ID，无法采集");
                this.isGathering = false;
                return;
            }

            // 发送网络请求
            const res = await NetManager.getInstance().post("/player/gather", {
                playerId: playerId,
                itemId: this.itemId,
                count: 1 // 默认采集1个，如果需要随机数量可以在 initInfo 里传入
            });

            if (res.success) {
                console.log("采集成功！");
                
                // 同步最新背包数据到全局缓存
                if (res.currentInventory && GlobalData.playerData) {
                    GlobalData.playerData.inventory = res.currentInventory;
                }

                // 播放成功特效并销毁
                this.playSuccessEffect();
            } else {
                console.warn("采集失败:", res.message);
                this.isGathering = false; // 失败了解锁，允许重试
            }

        } catch (err) {
            console.error("网络请求错误:", err);
            this.isGathering = false;
        }
    }

    playSuccessEffect() {
        // 1. 先隐藏按钮，防止二次点击
        if (this.bubbleNode) this.bubbleNode.active = false;

        // 2. 播放缩小动画，然后销毁节点
        new Tween(this.node)
            .to(0.3, { scale: new Vec3(0, 0, 0) })
            .call(() => {
                this.node.destroy();
            })
            .start();
    }
}