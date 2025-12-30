import { _decorator, Component, Label, EditBox, director } from 'cc';
import { Config } from './Config';

const { ccclass, property } = _decorator;

@ccclass('ApiTest')
export class ApiTest extends Component {

    @property(Label)
    resultLabel: Label = null!;

    @property(EditBox)
    accountEditBox: EditBox = null!;

    @property(EditBox)
    passwordEditBox: EditBox = null!;

    async onRegisterClick() {
        await this.doRequest("/auth/register", "正在注册...");
    }

    async onLoginClick() {
        await this.doRequest("/auth/login", "正在登录...");
    }

    async doRequest(path: string, tip: string) {
        if (!this.accountEditBox || !this.passwordEditBox || !this.resultLabel) {
            console.error("配置错误：请在编辑器中检查输入框和Label的连线！");
            return;
        }

        const username = this.accountEditBox.string;
        const password = this.passwordEditBox.string;

        if (!username || !password) {
            this.resultLabel.string = "提示：请输入账号和密码";
            return;
        }

        this.resultLabel.string = tip;

        try {
            const url = `${Config.ApiUrl}${path}`;
            console.log("发送请求至:", url); // 在控制台查看拼出来的地址对不对

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            // 获取返回的 JSON 数据
            const data = await response.json();

            if (response.ok) {
                if (path.includes("login")) {
                    this.resultLabel.string = "登录成功！正在进入医馆...";

                    // 存储 Token
                    if (data.access_token) {
                        localStorage.setItem("user_token", data.access_token);
                    }

                    // 1秒后跳转
                    setTimeout(() => {
                        director.loadScene("GameMain", (err) => {
                            if (err) {
                                this.resultLabel.string = "场景加载失败，请检查场景名";
                                console.error(err);
                            }
                        });
                    }, 1000);
                } else {
                    this.resultLabel.string = "注册成功！现在可以登录了";
                }
            } else {
                // 显示服务器返回的具体错误原因
                this.resultLabel.string = "操作失败: " + (data.message || "服务器拒绝请求");
            }
        } catch (e) {
            console.error("网络异常:", e);
            this.resultLabel.string = "网络连接失败，请检查网络或跨域设置";
        }
    }
}