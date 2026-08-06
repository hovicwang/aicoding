export { clipService, mockClipService } from "./mockAdapter";
export type {
  ClipService,
  UploadParams,
  UploadResponse,
  AnalysisParams,
  AnalysisResponse,
  FissionParams,
  FissionResponse,
  DistributeParams,
  DistributeResponse,
} from "./mockAdapter";
export { ok, err, ERROR_CODES } from "./types";
export type { Result, ServiceError } from "./types";
export {
  saveSourceVideo,
  getSourceVideo,
  deleteSourceVideo,
  saveVariantVideo,
  getVariantVideo,
  deleteVariantVideo,
  deleteProjectVideos,
  getSourceVideoUrl,
  getVariantVideoUrl,
  revokeProjectUrls,
} from "./videoStore";
export { probeVideo } from "./videoMeta";
export type { VideoMeta } from "./videoMeta";
export { transcodeVariant } from "./ffmpegService";
export type { TranscodeProgress } from "./ffmpegService";
