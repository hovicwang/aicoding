import type {
  AspectRatio,
  Channel,
  ClipDuration,
  DistributionStats,
  DistributionTask,
  Highlight,
  PlatformKey,
  Project,
  Variant,
} from "@/types";
import type { Result } from "./types";
import { err, ok, ERROR_CODES } from "./types";
import {
  generateHighlights,
  THUMB_GRADIENTS,
} from "@/data/mock";
import { saveSourceVideo } from "./videoStore";
import { probeVideo } from "./videoMeta";
import { transcodeVariant } from "./ffmpegService";

/* ============================================================
 * API 契约：后端就绪后由真实 HTTP 实现这些接口，UI 无需改动。
 * mock 适配器实现了同一套接口（带延迟与可控失败）。
 * ========================================================== */

export interface UploadParams {
  /** 真实视频文件，存入 IndexedDB 后可在浏览器内播放 */
  file: File;
  /** 进度回调（0-100） */
  onProgress?: (percent: number) => void;
  /** 取消信号 */
  signal?: AbortSignal;
}

export interface UploadResponse {
  projectId: string;
  title: string;
  duration: number;
  source: string;
  sizeLabel: string;
  /** 视频首帧缩略图（data URL），用于卡片展示 */
  thumbnail: string;
  width: number;
  height: number;
}

export interface AnalysisParams {
  projectId: string;
  duration: number;
  onProgress?: (stage: number, percent: number) => void;
  signal?: AbortSignal;
}

export interface AnalysisResponse {
  highlights: Highlight[];
}

export interface FissionParams {
  projectId: string;
  ratios: AspectRatio[];
  durations: ClipDuration[];
  platforms: PlatformKey[];
  styles: string[];
  /** 单个变体就绪回调，用于流式更新 UI */
  onVariantReady?: (variant: Variant, index: number, total: number) => void;
  signal?: AbortSignal;
}

export interface FissionResponse {
  variants: Variant[];
}

export interface DistributeParams {
  projectId: string;
  variantIds: string[];
  channelIds: string[];
  caption: string;
  /** store 预先生成的任务 ID（顺序与 variantIds×channelIds 一致） */
  taskIds: string[];
  /** 单个任务状态变更回调 */
  onTaskUpdate?: (
    taskId: string,
    status: DistributionTask["status"],
    stats?: DistributionStats,
  ) => void;
  /** 取消信号 */
  signal?: AbortSignal;
}

export interface DistributeResponse {
  taskIds: string[];
}

export interface ClipService {
  upload(params: UploadParams): Promise<Result<UploadResponse>>;
  analyze(params: AnalysisParams): Promise<Result<AnalysisResponse>>;
  fission(params: FissionParams): Promise<Result<FissionResponse>>;
  distribute(params: DistributeParams): Promise<Result<DistributeResponse>>;
  /** 账号授权/解绑 */
  connectChannel(channelId: string): Promise<Result<Channel>>;
  disconnectChannel(channelId: string): Promise<Result<Channel>>;
}

/* ============================================================
 * Mock 适配器实现
 * 通过 VITE_MOCK_FAILURE 环境变量可注入失败率用于错误路径验证。
 * ========================================================== */

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("aborted"));
      return;
    }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("aborted"));
    });
  });

const failureRate = Number(import.meta.env.VITE_MOCK_FAILURE ?? 0);

/** 按概率注入失败，用于验证错误路径与重试 */
function maybeFail<T>(value: T): Result<T> {
  if (failureRate > 0 && Math.random() < failureRate) {
    return err(
      ERROR_CODES.NETWORK,
      "服务暂时不可用，请稍后重试",
      true,
    );
  }
  return ok(value);
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function extOf(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : "MP4";
}

function rollStats(): DistributionStats {
  const views = Math.round(50000 + Math.random() * 2400000);
  const likes = Math.round(views * (0.04 + Math.random() * 0.06));
  const comments = Math.round(likes * (0.02 + Math.random() * 0.04));
  const shares = Math.round(likes * (0.1 + Math.random() * 0.15));
  return { views, likes, comments, shares };
}

export const mockClipService: ClipService = {
  async upload({ file, onProgress, signal }): Promise<Result<UploadResponse>> {
    try {
      // 先读取真实元数据（时长/分辨率/首帧缩略图）
      let meta;
      try {
        meta = await probeVideo(file);
      } catch (e) {
        return err(
          ERROR_CODES.VALIDATION,
          (e as Error).message,
          false,
        );
      }

      // 模拟分片上传进度
      let pct = 0;
      while (pct < 100) {
        await delay(120, signal);
        pct = Math.min(100, pct + Math.random() * 18 + 6);
        onProgress?.(pct);
      }

      const projectId = `p-${Date.now()}`;
      // 持久化到 IndexedDB，刷新后仍可播放
      await saveSourceVideo(projectId, file);

      const flaky = maybeFail<null>(null);
      if (!flaky.ok) return flaky;

      return ok({
        projectId,
        title: file.name.replace(/\.[^.]+$/, ""),
        duration: Math.round(meta.duration) || 120,
        source: `${extOf(file.name)} 原片`,
        sizeLabel: formatSize(file.size),
        thumbnail: meta.thumbnail,
        width: meta.width,
        height: meta.height,
      });
    } catch (e) {
      if ((e as Error).message === "aborted") {
        return err(ERROR_CODES.NETWORK, "上传已取消", false);
      }
      return err(ERROR_CODES.INTERNAL, "上传失败，请重试", true);
    }
  },

  async analyze({
    projectId,
    duration,
    onProgress,
    signal,
  }): Promise<Result<AnalysisResponse>> {
    try {
      const stages = 5;
      const stageDuration = 900;
      const total = stages * stageDuration;
      let elapsed = 0;
      while (elapsed < total) {
        await delay(80, signal);
        elapsed += 80;
        const percent = Math.min(100, (elapsed / total) * 100);
        const stage = Math.min(stages - 1, Math.floor(percent / 20));
        onProgress?.(stage, percent);
      }
      const flaky = maybeFail<null>(null);
      if (!flaky.ok) return flaky;
      const highlights = generateHighlights(projectId, duration || 1800);
      highlights.forEach((h) => {
        if (h.confidence > 0.85) h.selected = true;
      });
      return ok({ highlights });
    } catch (e) {
      if ((e as Error).message === "aborted") {
        return err(ERROR_CODES.NETWORK, "分析已取消", false);
      }
      return err(ERROR_CODES.INTERNAL, "AI 分析失败，可重试", true);
    }
  },

  async fission({
    projectId,
    ratios,
    durations,
    platforms,
    styles,
    onVariantReady,
    signal,
  }): Promise<Result<FissionResponse>> {
    try {
      const stamp = Date.now();
      const combos: Variant[] = [];
      let idx = 0;
      ratios.forEach((ar, ai) =>
        durations.forEach((d, di) =>
          platforms.forEach((pf, pi) =>
            styles.forEach((st, si) => {
              const n = ai * 100 + di * 10 + pi + si;
              combos.push({
                id: `${projectId}-gen-${stamp}-${n}`,
                projectId,
                aspectRatio: ar,
                duration: d,
                platform: pf,
                style: st,
                thumbnail: THUMB_GRADIENTS[idx % THUMB_GRADIENTS.length],
                status: "generating",
              });
              idx++;
            }),
          ),
        ),
      );

      const total = combos.length;
      for (let i = 0; i < total; i++) {
        if (signal?.aborted) throw new Error("aborted");
        const combo = combos[i];
        try {
          // 真实 ffmpeg 转码：裁切指定时长 + 适配目标比例
          const startSec = i * combo.duration; // 简单错开起始点，避免片段重叠
          await transcodeVariant({
            projectId,
            variantId: combo.id,
            aspectRatio: combo.aspectRatio,
            duration: combo.duration,
            start: startSec,
          });
          const v = { ...combo, status: "ready" as const };
          combos[i] = v;
          onVariantReady?.(v, i, total);
        } catch (e) {
          if ((e as Error).message === "aborted") throw e;
          // 单个变体失败标记为 failed，继续处理其余
          const v = { ...combo, status: "failed" as const };
          combos[i] = v;
          onVariantReady?.(v, i, total);
        }
      }
      const flaky = maybeFail<null>(null);
      if (!flaky.ok) return flaky;
      return ok({ variants: combos });
    } catch (e) {
      if ((e as Error).message === "aborted") {
        return err(ERROR_CODES.NETWORK, "裂变已取消", false);
      }
      return err(ERROR_CODES.INTERNAL, "裂变生成失败，可重试", true);
    }
  },

  async distribute({
    projectId,
    caption,
    taskIds,
    onTaskUpdate,
    signal,
  }): Promise<Result<DistributeResponse>> {
    try {
      void projectId;
      void caption;
      for (let idx = 0; idx < taskIds.length; idx++) {
        const taskId = taskIds[idx];
        // queued → publishing
        await delay(600 + idx * 100, signal);
        onTaskUpdate?.(taskId, "publishing");
        // publishing → published + stats
        await delay(1200 + idx * 200, signal);
        onTaskUpdate?.(taskId, "published", rollStats());
      }
      const flaky = maybeFail<null>(null);
      if (!flaky.ok) return flaky;
      return ok({ taskIds });
    } catch (e) {
      if ((e as Error).message === "aborted") {
        return err(ERROR_CODES.NETWORK, "分发已取消", false);
      }
      return err(ERROR_CODES.INTERNAL, "分发失败，可重试", true);
    }
  },

  async connectChannel(channelId): Promise<Result<Channel>> {
    await delay(400);
    return ok({
      id: channelId,
      name: "已授权账号",
      platform: "douyin" as PlatformKey,
      avatar: "",
      authStatus: "connected",
      followers: 0,
    });
  },

  async disconnectChannel(channelId): Promise<Result<Channel>> {
    await delay(300);
    return ok({
      id: channelId,
      name: "未授权",
      platform: "douyin" as PlatformKey,
      avatar: "",
      authStatus: "disconnected",
      followers: 0,
    });
  },
};

/** 对外暴露的当前实现：mock。后端就绪后改为 httpClipService。 */
export const clipService: ClipService = mockClipService;

export type { Project, Variant, Highlight, DistributionTask };
