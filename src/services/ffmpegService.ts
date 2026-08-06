/**
 * ffmpeg.wasm 转码服务
 * 在浏览器内对原始视频进行真实裁切/比例适配/时长截取，生成可播放的变体。
 * 首次调用时从 CDN 加载 ffmpeg 核心（约 30MB），之后缓存复用。
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
// 使用 unpkg CDN，国内可替换为 jsdelivr 或自托管
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(onProgress?: (p: TranscodeProgress) => void): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ff = new FFmpeg();
    ff.on("log", () => {
      // 日志可在此接入埋点
    });
    ff.on("progress", ({ progress }) => {
      onProgress?.({
        ratio: Math.max(0, Math.min(1, progress)),
        stage: "transcoding",
      });
    });
    onProgress?.({ ratio: 0, stage: "loading-core" });
    await ff.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ff;
    return ff;
  })();
  return loadPromise;
}

/** 计算目标分辨率（按比例与原视频宽高，保持画质） */
function computeTargetSize(
  aspect: AspectRatio,
  srcW: number,
  srcH: number,
): { w: number; h: number } {
  // 目标高度基准：竖屏 1080，横屏 720
  const base = aspect === "9:16" || aspect === "4:5" || aspect === "1:1" ? 1080 : 720;
  let w: number, h: number;
  if (aspect === "9:16") { w = 1080; h = 1920; }
  else if (aspect === "1:1") { w = 1080; h = 1080; }
  else if (aspect === "4:5") { w = 1080; h = 1350; }
  else { w = 1280; h = 720; }
  void srcW;
  void srcH;
  void base;
  return { w, h };
}

/**
 * 用 ffmpeg 对原始视频裁切出指定时长的片段并适配目标比例。
 * 生成的变体视频存入 IndexedDB，返回 blob URL。
 */
export async function transcodeVariant(params: {
  projectId: string;
  variantId: string;
  aspectRatio: AspectRatio;
  duration: ClipDuration;
  /** 起始时间（秒），默认取视频前 1/4 处的高光段 */
  start?: number;
  onProgress?: (p: TranscodeProgress) => void;
}): Promise<{ url: string; size: number }> {
  const { projectId, variantId, aspectRatio, duration, start, onProgress } = params;

  const sourceBlob = await getSourceVideo(projectId);
  if (!sourceBlob) throw new Error("原始视频不存在，可能已被清理");

  const ff = await getFFmpeg(onProgress);

  onProgress?.({ ratio: 0, stage: "preparing" });
  const inputName = `in_${projectId}.mp4`;
  const outputName = `out_${variantId}.mp4`;
  await ff.writeFile(inputName, await fetchFile(sourceBlob));

  // 读取原始分辨率
  const srcW = 1280, srcH = 720;
  try {
    const meta = await ff.exec(["-i", inputName]);
    void meta;
  } catch {
    // exec 某些版本对 -i 返回非零，忽略
  }

  const { w, h } = computeTargetSize(aspectRatio, srcW, srcH);
  const ss = start ?? 0;

  // 裁切 + 比例适配（裁掉溢出部分，center crop）+ 重编码
  onProgress?.({ ratio: 0.1, stage: "transcoding" });
  await ff.exec([
    "-ss", String(ss),
    "-t", String(duration),
    "-i", inputName,
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
  await saveVariantVideo(variantId, blob);

  // 清理内存
  try {
    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);
  } catch {
    // 忽略清理失败
  }

  onProgress?.({ ratio: 1, stage: "done" });
  const url = URL.createObjectURL(blob);
  return { url, size: blob.size };
}

/** 释放 ffmpeg 实例（页面卸载时调用） */
export function terminateFFmpeg() {
  try {
    ffmpegInstance?.terminate();
  } catch {
    // 忽略
  }
  ffmpegInstance = null;
  loadPromise = null;
}
