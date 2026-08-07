import { useEffect, useState } from "react";
import { getSourceVideoUrl, getVariantVideoUrl } from "@/services/videoStore";

interface VideoUrlState {
  url: string | null;
  loading: boolean;
  error: string | null;
}

const IDLE: VideoUrlState = { url: null, loading: true, error: null };

/**
 * 把 project.videoUrl（"idb:projectId" 或直接 URL）解析为可播放的 blob URL。
 * 刷新后从 IndexedDB 重新读取，blob URL 自动缓存。
 * IDB 不可用或视频被清理时返回 error，UI 可据此降级提示。
 */
export function useSourceVideoUrl(videoUrl: string | undefined): VideoUrlState {
  const [state, setState] = useState<VideoUrlState>(IDLE);

  useEffect(() => {
    let active = true;
    if (!videoUrl) {
      setState({ url: null, loading: false, error: null });
      return;
    }
    setState(IDLE);
    if (videoUrl.startsWith("idb:")) {
      const projectId = videoUrl.slice(4);
      getSourceVideoUrl(projectId)
        .then((u) => {
          if (!active) return;
          if (u) setState({ url: u, loading: false, error: null });
          else
            setState({
              url: null,
              loading: false,
              error: "原视频已被清理，请重新上传",
            });
        })
        .catch((e) => {
          if (active)
            setState({
              url: null,
              loading: false,
              error: e instanceof Error ? e.message : "视频加载失败",
            });
        });
    } else {
      setState({ url: videoUrl, loading: false, error: null });
    }
    return () => {
      active = false;
    };
  }, [videoUrl]);

  return state;
}

/** 变体视频 URL 解析 */
export function useVariantVideoUrl(variantId: string): VideoUrlState {
  const [state, setState] = useState<VideoUrlState>(IDLE);

  useEffect(() => {
    let active = true;
    setState(IDLE);
    getVariantVideoUrl(variantId)
      .then((u) => {
        if (!active) return;
        setState({ url: u, loading: false, error: null });
      })
      .catch((e) => {
        if (active)
          setState({
            url: null,
            loading: false,
            error: e instanceof Error ? e.message : "变体加载失败",
          });
      });
    return () => {
      active = false;
    };
  }, [variantId]);

  return state;
}
