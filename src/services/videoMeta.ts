/**
 * 视频元数据提取与首帧缩略图生成
 * 纯前端实现，通过临时 <video> + canvas 抓取。
 */

export interface VideoMeta {
  duration: number; // 秒
  width: number;
  height: number;
  thumbnail: string; // data URL（JPEG）
}

/** 读取视频真实时长、分辨率，并抓取首帧作为缩略图 */
export function probeVideo(file: File | Blob): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;

    let settled = false;

    const cleanup = () => {
      // 仅 revoke blob URL，不强制 removeAttribute+load（会触发 ERR_ABORTED）。
      // revoke 后 video 自然无法继续加载，且该 video 元素未挂载到 DOM，无需 load()。
      URL.revokeObjectURL(url);
    };

    const onMeta = () => {
      // metadata 已加载，先拿到时长/尺寸
      const duration = isFinite(video.duration) ? video.duration : 0;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      // seek 到 1 秒处抓帧（避开黑屏开场）
      const seekTo = Math.min(1, Math.max(0.1, duration * 0.1));
      const onSeeked = () => {
        try {
          const canvas = document.createElement("canvas");
          const scale = Math.min(1, 640 / width);
          canvas.width = Math.max(1, Math.round(width * scale));
          canvas.height = Math.max(1, Math.round(height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            cleanup();
            resolve({ duration, width, height, thumbnail: "" });
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumb = canvas.toDataURL("image/jpeg", 0.7);
          cleanup();
          settled = true;
          resolve({ duration, width, height, thumbnail: thumb });
        } catch {
          cleanup();
          settled = true;
          resolve({ duration, width, height, thumbnail: "" });
        }
      };
      video.addEventListener("seeked", onSeeked, { once: true });
      try {
        video.currentTime = seekTo;
      } catch {
        // 某些格式无法 seek，直接用当前帧
        onSeeked();
      }
    };

    const onError = () => {
      if (settled) return;
      cleanup();
      reject(new Error("无法读取视频元数据，文件可能已损坏或不被浏览器支持"));
    };

    video.addEventListener("loadedmetadata", onMeta, { once: true });
    video.addEventListener("error", onError, { once: true });

    // 兜底超时（某些容器 metadata 加载缓慢或无法解码）
    setTimeout(() => {
      if (!settled) onError();
    }, 8000);
  });
}
