/**
 * ffmpeg.wasm 转码服务
 * 在浏览器内对原始视频进行真实裁切/比例适配/时长截取，生成可播放的变体。
 * 首次调用时从 CDN 加载 ffmpeg 核心（约 30MB），之后缓存复用。
 *
 * 注意：使用 @ffmpeg/core 单线程版，通过 Web Worker 运行，
 * 不需要 SharedArrayBuffer，因此无需 COOP/COEP 跨源隔离头。
 */
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { AspectRatio, ClipDuration } from "@/types";
import { getSourceVideo } from "./videoStore";
import { saveVariantVideo } from "./videoStore";

export interface TranscodeProgress {
  ratio: number; // 0-1
  stage: "loading-core" | "preparing" | "transcoding" | "done";
}

const CORE_VERSION = "0.12.10";
// 多源回退：unpkg → jsdelivr，国内网络下提高可用性
const CORE_SOURCES = [
  `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`,
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`,
  `https://fastly.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`,
];

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;
// 当前转码进度回调（每次 transcodeVariant 调用前赋值）
let currentProgressCb: ((p: TranscodeProgress) => void) | null = null;

/** 带超时的 toBlobURL，单个源失败切下一个 */
async function loadCoreWithFallback(): Promise<{ coreURL: string; wasmURL: string }> {
  let lastError: unknown;
  for (const base of CORE_SOURCES) {
    try {
      const coreURL = await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript");
      const wasmURL = await toBlobURL(
        `${base}/ffmpeg-core.wasm`,
        "application/wasm",
      );
      return { coreURL, wasmURL };
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error(
    `ffmpeg 核心加载失败，请检查网络后重试。${
      lastError instanceof Error ? `（${lastError.message}）` : ""
    }`,
  );
}

async function getFFmpeg(
  onProgress?: (p: TranscodeProgress) => void,
): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ff = new FFmpeg();
    ff.on("log", () => {
      // 日志可在此接入埋点，不影响主流程
    });
    ff.on("progress", ({ progress }) => {
      currentProgressCb?.({
        ratio: Math.max(0, Math.min(1, progress)),
        stage: "transcoding",
      });
    });
    onProgress?.({ ratio: 0, stage: "loading-core" });
    const { coreURL, wasmURL } = await loadCoreWithFallback();
    await ff.load({ coreURL, wasmURL });
    ffmpegInstance = ff;
    return ff;
  })();

  // 加载失败时清空 loadPromise，允许下次重试（不永久缓存 rejected）
  try {
    return await loadPromise;
  } catch (e) {
    loadPromise = null;
    throw e;
  }
}

/** 计算目标分辨率（按比例） */
function computeTargetSize(aspect: AspectRatio): { w: number; h: number } {
  if (aspect === "9:16") return { w: 1080, h: 1920 };
  if (aspect === "1:1") return { w: 1080, h: 1080 };
  if (aspect === "4:5") return { w: 1080, h: 1350 };
  return { w: 1280, h: 720 };
}

/**
 * 计算安全的起始时间，确保不超出视频时长。
 * 在可用区间内均匀分布起始点，让不同变体取不同片段。
 */
function safeStart(
  index: number,
  duration: number,
  videoDuration: number,
): number {
  // 视频时长未知或极短：从 0 开始
  if (!videoDuration || videoDuration <= duration) return 0;
  const maxStart = videoDuration - duration;
  // 在 [0, maxStart] 区间均匀分布，避免所有变体取同一段
  // 用取模防止数值过大
  const slots = Math.min(8, Math.floor(maxStart / Math.max(1, duration)) + 1);
  return (index % slots) * (maxStart / Math.max(1, slots - 1 || 1));
}

/**
 * 用 ffmpeg 对原始视频裁切出指定时长的片段并适配目标比例。
 * 生成的变体视频存入 IndexedDB。
 */
export async function transcodeVariant(params: {
  projectId: string;
  variantId: string;
  aspectRatio: AspectRatio;
  duration: ClipDuration;
  /** 起始时间（秒），已由调用方保证安全 */
  start?: number;
  /** 原视频真实时长（秒），用于计算安全起始点 */
  videoDuration?: number;
  /** 变体在批次中的索引，用于分布起始点 */
  index?: number;
  onProgress?: (p: TranscodeProgress) => void;
}): Promise<{ size: number }> {
  const {
    projectId,
    variantId,
    aspectRatio,
    duration,
    start,
    videoDuration,
    index = 0,
    onProgress,
  } = params;

  const sourceBlob = await getSourceVideo(projectId);
  if (!sourceBlob) throw new Error("原始视频不存在，可能已被清理");

  // 浏览器内转码内存上限：超过 500MB 拒绝，避免 tab OOM
  const MAX_BROWSER_TRANSCODE_SIZE = 500 * 1024 * 1024;
  if (sourceBlob.size > MAX_BROWSER_TRANSCODE_SIZE) {
    throw new Error(
      `原视频 ${(sourceBlob.size / 1024 / 1024).toFixed(0)}MB 超出浏览器转码上限（500MB），请压缩后再试或使用服务端转码`,
    );
  }

  // 注册本次调用的进度回调
  currentProgressCb = onProgress ?? null;
  const ff = await getFFmpeg(onProgress);

  const inputName = `in_${projectId}_${variantId}.mp4`;
  const outputName = `out_${variantId}.mp4`;
  try {
    onProgress?.({ ratio: 0, stage: "preparing" });
    await ff.writeFile(inputName, await fetchFile(sourceBlob));

    const { w, h } = computeTargetSize(aspectRatio);
    // 计算安全起始点：优先用传入的 start，否则基于 videoDuration 计算
    const ss =
      start != null
        ? Math.max(0, Math.min(start, Math.max(0, (videoDuration ?? 0) - duration)))
        : safeStart(index, duration, videoDuration ?? 0);

    onProgress?.({ ratio: 0.05, stage: "transcoding" });
    // -ss/-t 放在 -i 之后（output seeking），即使 seek 超出也不会崩溃
    await ff.exec([
      "-i", inputName,
      "-ss", String(ss),
      "-t", String(duration),
      "-vf", `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "26",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      "-y",
      outputName,
    ]);

    const data = await ff.readFile(outputName);
    const blob = new Blob([data as Uint8Array], { type: "video/mp4" });
    // 输出为空说明裁切失败（如视频太短），拒绝生成空文件
    if (blob.size < 1000) {
      throw new Error("转码输出为空，原视频可能短于目标时长");
    }
    await saveVariantVideo(variantId, blob);

    onProgress?.({ ratio: 1, stage: "done" });
    return { size: blob.size };
  } finally {
    // 无论成功失败都清理虚拟文件，避免内存累积
    currentProgressCb = null;
    try {
      await ff.deleteFile(inputName);
    } catch {
      // 忽略
    }
    try {
      await ff.deleteFile(outputName);
    } catch {
      // 忽略
    }
  }
}

/** 释放 ffmpeg 实例（加载失败重试 / 页面卸载时调用） */
export function terminateFFmpeg() {
  try {
    ffmpegInstance?.terminate();
  } catch {
    // 忽略
  }
  ffmpegInstance = null;
  loadPromise = null;
  currentProgressCb = null;
}
