import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TimeDisplay')
export class TimeDisplay extends Component {

    @property(Label)
    timeLabel: Label = null!; // 记得在编辑器里把 Label 拖到这个槽位上

    // 这个函数每帧都会执行，确保秒表实时跳动
    update(dt: number) {
        const now = new Date(); // 获取当前系统时间

        const h = now.getHours();
        const m = now.getMinutes();
        const s = now.getSeconds();

        // --- 兼容性补零逻辑 ---
        // 如果数字小于 10，就在前面拼一个 "0"
        let hours: string | number = h;
        if (h < 10) hours = "0" + h;

        let minutes: string | number = m;
        if (m < 10) minutes = "0" + m;

        let seconds: string | number = s;
        if (s < 10) seconds = "0" + s;

        // 把拼好的字符串显示出来
        if (this.timeLabel) {
            this.timeLabel.string = hours + ":" + minutes + ":" + seconds;
        }
    }
}