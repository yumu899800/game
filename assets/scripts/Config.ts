export enum EnvType {
    LOCAL = 0,
    REMOTE = 1,
    PROD = 2
}
export class Config {
    private static currentEnv: EnvType = EnvType.REMOTE;

    private static remoteUrl: string = "http://8.148.82.231:3000";

    public static get ApiUrl(): string {
        switch (this.currentEnv) {
            case EnvType.LOCAL:
                return "http://localhost:3000";
            case EnvType.REMOTE:
                return this.remoteUrl;
            default:
                return "http://localhost:3000";
        }
    }
}