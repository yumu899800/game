import { Config } from "./Config"; 

export class NetManager {
    private static instance: NetManager;
    
    private get baseUrl(): string {
        return Config.ApiUrl;
    }

    private token: string = "";

    // 私有构造函数，确保单例
    private constructor() {
        // 初始化时自动从本地存储加载已有的 Token
        this.token = localStorage.getItem("jwt_token") || "";
    }

    public static getInstance(): NetManager {
        if (!this.instance) this.instance = new NetManager();
        return this.instance;
    }

    // 设置 Token 并持久化
    setToken(token: string) {
        this.token = token;
        localStorage.setItem("jwt_token", token); 
    }

    /**
     * 基础 POST 请求
     */
    async post(endpoint: string, data: any) {
        const headers = {
            "Content-Type": "application/json",
        };
        if (this.token) {
            headers["Authorization"] = `Bearer ${this.token}`;
        }

        try {
            // 使用 this.baseUrl 动态拼接
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw result; 
            return result;
        } catch (error) {
            console.error(`POST 请求错误 ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * 基础 GET 请求
     */
    async get(endpoint: string) {
        const headers = {};
        if (this.token) {
            headers["Authorization"] = `Bearer ${this.token}`;
        }
        
        try {
            // 使用 this.baseUrl 动态拼接
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: "GET",
                headers: headers,
            });
            const result = await response.json();
            if (!response.ok) throw result;
            return result;
        } catch (error) {
            console.error(`GET 请求错误 ${endpoint}:`, error);
            throw error;
        }
    }
}