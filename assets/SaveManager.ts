import { _decorator, Component, Label, EditBox } from 'cc';
import { Config } from './Config';

const { ccclass, property } = _decorator;

@ccclass('SaveManager')
export class SaveManager extends Component {

    @property(EditBox)
    nicknameInput: EditBox = null!;

    @property(Label)
    statusLabel: Label = null!;

    // 绑定给“开张大吉”按钮
    async onCreateSaveClick() {
        const nickname = this.nicknameInput.string;
        if (!nickname) {
            this.statusLabel.string = "请先给医馆起个大名";
            return;
        }

        // 获取登录时保存的 Token
        const token = localStorage.getItem("user_token");
        if (!token) {
            this.statusLabel.string = "登录失效，请重新登录";
            return;
        }

        this.statusLabel.string = "正在申请开张...";

        try {
            const response = await fetch(`${Config.ApiUrl}/player/create-save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token // 兼容旧版，不用模板字符串
                },
                body: JSON.stringify({ nickname: nickname })
            });

            const data = await response.json();

            if (response.ok) {
                this.statusLabel.string = "开张成功！ " + nickname;
                
                // 成功后隐藏创建界面（可选）
                 //this.node.active = false; 
            } else {
                this.statusLabel.string = "失败：" + (data.message || "起名重复");
            }
        } catch (e) {
            this.statusLabel.string = "网络繁忙，请稍后再试";
        }
    }
}