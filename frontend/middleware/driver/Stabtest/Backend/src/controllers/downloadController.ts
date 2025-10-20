import { Request, Response } from 'express';
import { DownloadTask } from '../lib/DownloadTask';
import { WebSocketManager } from '../lib/WebSocketManager';
import { ApiResponse } from '../types';
import * as path from 'path';

// ダウンロード先ディレクトリ
const DOWNLOAD_DIR = path.join(__dirname, '../../download');

// WebSocketマネージャー（後で注入される）
let wsManager: WebSocketManager | null = null;

// アクティブなダウンロードタスク管理
const activeTasks = new Map<string, DownloadTask>();

/**
 * WebSocketマネージャーを設定
 */
export function setWebSocketManager(manager: WebSocketManager): void {
  wsManager = manager;
}

/**
 * ファイルダウンロードを開始
 * POST /api/download
 * Body: { url: string, filename?: string }
 */
export const startDownload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, filename } = req.body;

    if (!url) {
      res.status(400).json({
        success: false,
        error: {
          message: 'URL is required',
          code: 'MISSING_URL',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // タスクIDを生成
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🚀 Starting download task: ${taskId}`);
    console.log(`   URL: ${url}`);
    console.log(`   Save to: ${DOWNLOAD_DIR}`);

    // ダウンロードタスクを作成
    const task = new DownloadTask(
      taskId,
      url,
      DOWNLOAD_DIR,
      // 進捗コールバック
      (progress) => {
        if (wsManager) {
          wsManager.broadcastProgress(progress);
        }
      },
      // 完了コールバック
      () => {
        console.log(`✅ Download completed: ${taskId}`);
        if (wsManager) {
          wsManager.broadcastComplete(taskId, task.getFilename());
        }
        activeTasks.delete(taskId);
      },
      // エラーコールバック
      (error) => {
        console.error(`❌ Download error: ${taskId}`, error.message);
        if (wsManager) {
          wsManager.broadcastError(taskId, error.message);
        }
        activeTasks.delete(taskId);
      }
    );

    // タスクを保存
    activeTasks.set(taskId, task);

    // ダウンロードを開始（非同期）
    task.start().catch((error) => {
      console.error(`Failed to start download: ${error.message}`);
    });

    // レスポンスを即座に返す
    const apiResponse: ApiResponse = {
      success: true,
      data: {
        taskId,
        message: 'Download started',
        status: task.getStatus(),
      },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(apiResponse);
  } catch (error: any) {
    console.error('❌ Failed to start download:', error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to start download',
        code: 'DOWNLOAD_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * ダウンロードタスクのステータスを取得
 * GET /api/download/:taskId
 */
export const getDownloadStatus = (req: Request, res: Response): void => {
  try {
    const { taskId } = req.params;
    const task = activeTasks.get(taskId);

    if (!task) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Task not found',
          code: 'TASK_NOT_FOUND',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const apiResponse: ApiResponse = {
      success: true,
      data: task.getStatus(),
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(apiResponse);
  } catch (error: any) {
    console.error('❌ Failed to get download status:', error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get download status',
        code: 'STATUS_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * アクティブなダウンロードタスク一覧を取得
 * GET /api/downloads
 */
export const getActiveDownloads = (req: Request, res: Response): void => {
  try {
    const tasks = Array.from(activeTasks.values()).map((task) => task.getStatus());

    const apiResponse: ApiResponse = {
      success: true,
      data: tasks,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(apiResponse);
  } catch (error: any) {
    console.error('❌ Failed to get active downloads:', error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get active downloads',
        code: 'LIST_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * ダウンロードタスクをキャンセル
 * DELETE /api/download/:taskId
 */
export const cancelDownload = (req: Request, res: Response): void => {
  try {
    const { taskId } = req.params;
    const task = activeTasks.get(taskId);

    if (!task) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Task not found',
          code: 'TASK_NOT_FOUND',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    task.cancel();
    activeTasks.delete(taskId);

    const apiResponse: ApiResponse = {
      success: true,
      data: {
        taskId,
        message: 'Download cancelled',
      },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(apiResponse);
  } catch (error: any) {
    console.error('❌ Failed to cancel download:', error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to cancel download',
        code: 'CANCEL_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
};
