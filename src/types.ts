export type ProjectStatus =
  | "analyzing"
  | "ready"
  | "clipped"
  | "fissioned"
  | "distributed";

export type HighlightType = "peak" | "quote" | "action" | "emotion";

export interface Highlight {
  id: string;
  projectId: string;
  start: number; // seconds
  end: number; // seconds
  label: string;
  confidence: number; // 0-1
  type: HighlightType;
  selected?: boolean;
}

export type AspectRatio = "9:16" | "1:1" | "16:9" | "4:5";
export type ClipDuration = 15 | 30 | 60;

export interface Variant {
  id: string;
  projectId: string;
  aspectRatio: AspectRatio;
  duration: ClipDuration;
  platform: string;
  style: string;
  thumbnail: string;
  status: "generating" | "ready" | "failed";
  /** 失败原因（status=failed 时填充），用于 UI 展示与排查 */
  error?: string;
}

export type PlatformKey =
  | "douyin"
  | "xiaohongshu"
  | "wechat"
  | "bilibili"
  | "youtube";

export interface Channel {
  id: string;
  name: string;
  platform: PlatformKey;
  avatar: string;
  authStatus: "connected" | "expired" | "disconnected";
  followers: number;
}

export interface DistributionStats {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface DistributionTask {
  id: string;
  variantId: string;
  projectId: string;
  channelId: string;
  status: "queued" | "publishing" | "published" | "failed";
  publishedAt?: string;
  stats?: DistributionStats;
  caption: string;
}

export interface Project {
  id: string;
  title: string;
  videoUrl: string;
  duration: number; // seconds
  status: ProjectStatus;
  thumbnail: string;
  uploadedAt: string;
  source: string;
  highlights: Highlight[];
  variants: Variant[];
}

export interface PlatformMeta {
  key: PlatformKey;
  name: string;
  color: string;
  short: string;
}
