import express from 'express';
import './lib/types'; // 型定義をグローバルに適用
import { SESSION_SECRET } from './lib/constants';
import { DevUserManager } from './lib/dev-user-manager';
import { MinecraftServerManager } from './lib/minecraft-server-manager';
import { MiddlewareManager } from './lib/middleware-manager';
import { ApiRouter, MinecraftServerRouter, SampleApiRouter } from './lib/api-router';

/**
 * アプリケーションのエントリーポイント
 */
async function main(port: number): Promise<void> {
    // 1. 開発用ユーザーデータの初期化
    await DevUserManager.initialize();
    await MinecraftServerManager.initialize();

    // 2. Expressアプリケーションのインスタンス化
    const app = express();

    // 3. ミドルウェアのセットアップ
    const middlewareManager = new MiddlewareManager(app);
    middlewareManager.configure();

    // 4. ルーティングのセットアップ
    const apiRouter = new ApiRouter(app, middlewareManager.authMiddleware);
    apiRouter.configureRoutes();

    // 4.1. 【雛形】サンプルAPIルーターのセットアップ
    const sampleApiRouter = new SampleApiRouter(middlewareManager.authMiddleware);
    app.use('/api/sample', sampleApiRouter.router); // `/api/sample` プレフィックスでマウント

    // 4.2. Minecraftサーバー管理APIルーターのセットアップ
    const mcServerRouter = new MinecraftServerRouter(middlewareManager.authMiddleware);
    app.use('/api/servers', mcServerRouter.router);

    // 5. エラーハンドリングミドルウェアのセットアップ (ルーティングの後)
    middlewareManager.setupErrorHandlers();

    // 6. サーバーの起動
    app.listen(port, '0.0.0.0', () => {
        console.log(`=== Front Driver Server Started ===`);
        console.log(`Port: ${port}`);
        console.log(`URL: http://127.0.0.1:${port}/`);
        console.log(`Sample API: http://127.0.0.1:${port}/api/sample/public-info`);
        console.log(`Session Secret: ${SESSION_SECRET.substring(0, 10)}...`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`=====================================`);
    });
}

// サーバー起動（ポート12800で開始）
main(12800).catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
