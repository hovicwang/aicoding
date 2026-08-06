import { useEffect, useState } from "react";
import { getSourceVideoUrl, getVariantVideoUrl } from "@/services/videoStore";

/**
 * 把 project.videoUrl（"idb:projectId" 或直接 URL）解析为可播放的 blob URL。
 * 刷新后从 IndexedDB 重新读取，blob URL 自动缓存。
 */
export function useSourceVideoUrl(videoUrl: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!videoUrl) {
      setUrl(null);
      return;
    }
    if (videoUrl.startsWith("idb:")) {
      const projectId = videoUrl.slice(4);
      getSourceVideoUrl(projectId).then((u) => {
        if (active) setUrl(u);
      });
    } else {
      setUrl(videoUrl);
    }
    return () => {
      active = false;
    };
  }, [videoUrl]);

  return url;
}

/** 变体视频 URL 解析 */
export function useVariantVideoUrl(variantId: string): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getVariantVideoUrl(variantId).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [variantId]);

  return url;
}
