import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Channel,
  DistributionTask,
  Project,
  ProjectStatus,
  Variant,
} from "@/types";
import {
  channels as seedChannels,
  distributionTasks as seedTasks,
  projects as seedProjects,
  pickThumb,
} from "@/data/mock";
import { clipService } from "@/services";
import type { Result } from "@/services";
import { deleteProjectVideos, deleteVariantVideo, revokeProjectUrls } from "@/services/videoStore";
import { toast } from "@/components/ui/toastStore";

/* ============================================================
 * 异步操作状态机：每个长任务对应一条 async 状态记录
 * ========================================================== */
export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface AsyncState {
  status: AsyncStatus;
  error?: string;
  /** 进行中可取消 */
  abort?: () => void;
}

export interface UploadFileInfo {
  title: string;
  duration: number;
  source: string;
  sizeLabel: string;
}

interface ProjectState {
  projects: Project[];
  channels: Channel[];
  tasks: DistributionTask[];
  analysisProgress: Record<string, { stage: number; percent: number }>;
  pendingDistribution: { projectId: string; variantIds: string[] } | null;

  // 每个异步操作的运行状态，key 为业务标识
  async: Record<string, AsyncState>;

  // 同步业务动作
  toggleHighlight: (projectId: string, highlightId: string) => void;
  selectAllHighlights: (projectId: string, value: boolean) => void;
  saveVariants: (projectId: string, variants: Variant[]) => void;
  setProjectStatus: (projectId: string, status: ProjectStatus) => void;
  deleteProject: (projectId: string) => void;
  setPendingDistribution: (projectId: string, variantIds: string[]) => void;
  clearPendingDistribution: () => void;
  removeVariant: (projectId: string, variantId: string) => void;
  getProject: (projectId: string) => Project | undefined;

  // 异步动作（经 service 层）
  uploadAndAnalyze: (
    file: File,
    onUploadProgress?: (p: number) => void,
  ) => Promise<{ ok: boolean; projectId?: string; error?: string }>;
  retryAnalysis: (projectId: string) => Promise<void>;
  cancelAnalysis: (projectId: string) => void;
  generateFission: (
    projectId: string,
    params: {
      ratios: Variant["aspectRatio"][];
      durations: Variant["duration"][];
      platforms: string[];
      styles: string[];
    },
    onVariantReady?: (v: Variant) => void,
  ) => Promise<{ ok: boolean; error?: string }>;
  cancelFission: (projectId: string) => void;
  distribute: (
    projectId: string,
    variantIds: string[],
    channelIds: string[],
    caption: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  retryTask: (taskId: string) => void;
  cancelTask: (taskId: string) => void;
  reconnectChannel: (channelId: string) => Promise<void>;
  disconnectChannel: (channelId: string) => Promise<void>;
}

const setAsync = (
  set: (fn: (s: ProjectState) => Partial<ProjectState>) => void,
  key: string,
  patch: Partial<AsyncState>,
) =>
  set((s) => ({ async: { ...s.async, [key]: { ...s.async[key], ...patch } } }));

const unwrap = <T>(
  r: Result<T>,
): { ok: boolean; data?: T; error?: string } => {
  if (r.ok) return { ok: true, data: r.data };
  return { ok: false, error: (r as { error: { message: string } }).error.message };
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: seedProjects,
      channels: seedChannels,
      tasks: seedTasks,
      analysisProgress: {},
      pendingDistribution: null,
      async: {},

      getProject: (projectId) =>
        get().projects.find((p) => p.id === projectId),

      toggleHighlight: (projectId, highlightId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id !== projectId
              ? p
              : {
                  ...p,
                  highlights: p.highlights.map((h) =>
                    h.id === highlightId
                      ? { ...h, selected: !h.selected }
                      : h,
                  ),
                },
          ),
        })),

      selectAllHighlights: (projectId, value) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id !== projectId
              ? p
              : {
                  ...p,
                  highlights: p.highlights.map((h) => ({
                    ...h,
                    selected: value,
                  })),
                },
          ),
        })),

      saveVariants: (projectId, variants) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id !== projectId ? p : { ...p, variants },
          ),
        })),

      setProjectStatus: (projectId, status) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, status } : p,
          ),
        })),

      deleteProject: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        const variantIds = project?.variants.map((v) => v.id) ?? [];
        // 清理 IndexedDB 与 blob URL 缓存
        void deleteProjectVideos(projectId, variantIds);
        revokeProjectUrls(projectId, variantIds);
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          tasks: state.tasks.filter((t) => t.projectId !== projectId),
          analysisProgress: Object.fromEntries(
            Object.entries(state.analysisProgress).filter(
              ([k]) => k !== projectId,
            ),
          ),
        }));
      },

      setPendingDistribution: (projectId, variantIds) =>
        set({ pendingDistribution: { projectId, variantIds } }),

      clearPendingDistribution: () => set({ pendingDistribution: null }),

      removeVariant: (projectId, variantId) => {
        void deleteVariantVideo(variantId);
        revokeProjectUrls(projectId, [variantId]);
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id !== projectId
              ? p
              : { ...p, variants: p.variants.filter((v) => v.id !== variantId) },
          ),
        }));
      },

      /* ---------- 上传 + 分析（合并为一次端到端流程） ---------- */
      uploadAndAnalyze: async (file, onUploadProgress) => {
        const uploadKey = "upload";
        const controller = new AbortController();
        setAsync(set, uploadKey, {
          status: "loading",
          error: undefined,
          abort: () => controller.abort(),
        });

        const up = await clipService.upload({
          file,
          onProgress: onUploadProgress,
          signal: controller.signal,
        });
        const ur = unwrap(up);
        if (!ur.ok) {
          setAsync(set, uploadKey, { status: "error", error: ur.error, abort: undefined });
          return { ok: false, error: ur.error };
        }

        // 创建项目（videoUrl 标记为 "idb:"，播放时从 IndexedDB 取真实 blob）
        const projectId = ur.data.projectId;
        const data = ur.data;
        set((state) => ({
          projects: [
            {
              id: projectId,
              title: data.title,
              videoUrl: `idb:${projectId}`,
              duration: data.duration,
              status: "analyzing" as ProjectStatus,
              thumbnail: data.thumbnail || pickThumb(Date.now() % 6),
              uploadedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
              source: `${data.source} · ${data.sizeLabel}`,
              highlights: [],
              variants: [],
            },
            ...state.projects,
          ],
          analysisProgress: {
            ...state.analysisProgress,
            [projectId]: { stage: 0, percent: 0 },
          },
        }));
        setAsync(set, uploadKey, { status: "success", abort: undefined });

        // 紧接分析（fire-and-forget，让 Studio 接管进度展示）
        void get().retryAnalysis(projectId);
        return { ok: true, projectId };
      },

      retryAnalysis: async (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const key = `analysis-${projectId}`;
        // 幂等：已有进行中的分析则不重复触发
        if (get().async[key]?.status === "loading") return;
        const controller = new AbortController();
        setAsync(set, key, {
          status: "loading",
          error: undefined,
          abort: () => controller.abort(),
        });
        // 重置进度
        set((s) => ({
          analysisProgress: {
            ...s.analysisProgress,
            [projectId]: { stage: 0, percent: 0 },
          },
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, status: "analyzing" as ProjectStatus } : p,
          ),
        }));

        const r = await clipService.analyze({
          projectId,
          duration: project.duration,
          onProgress: (stage, percent) =>
            set((s) => ({
              analysisProgress: {
                ...s.analysisProgress,
                [projectId]: { stage, percent },
              },
            })),
          signal: controller.signal,
        });
        const ar = unwrap(r);
        if (!ar.ok) {
          // 用户主动取消：静默置 idle，不弹错误 toast
          if (controller.signal.aborted) {
            setAsync(set, key, { status: "idle", abort: undefined });
            return;
          }
          setAsync(set, key, { status: "error", error: ar.error, abort: undefined });
          toast.error(ar.error);
          return;
        }
        const { [projectId]: _omit, ...rest } = get().analysisProgress;
        void _omit;
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, highlights: ar.data.highlights, status: "ready" as ProjectStatus }
              : p,
          ),
          analysisProgress: rest,
        }));
        setAsync(set, key, { status: "success", abort: undefined });
        toast.success("AI 高光分析完成");
      },

      cancelAnalysis: (projectId) => {
        const key = `analysis-${projectId}`;
        get().async[key]?.abort?.();
        setAsync(set, key, { status: "idle", abort: undefined });
      },

      /* ---------- 裂变 ---------- */
      generateFission: async (projectId, params, onVariantReady) => {
        const key = `fission-${projectId}`;
        const controller = new AbortController();
        setAsync(set, key, {
          status: "loading",
          error: undefined,
          abort: () => controller.abort(),
        });

        const r = await clipService.fission({
          projectId,
          ratios: params.ratios as never,
          durations: params.durations as never,
          platforms: params.platforms as never,
          styles: params.styles,
          onVariantReady: (v) => {
            onVariantReady?.(v);
            // 流式持久化：每就绪一个即写入 store
            set((s) => ({
              projects: s.projects.map((p) =>
                p.id !== projectId
                  ? p
                  : { ...p, variants: upsertVariant(p.variants, v) },
              ),
            }));
          },
          signal: controller.signal,
        });
        const fr = unwrap(r);
        if (!fr.ok) {
          setAsync(set, key, { status: "error", error: fr.error, abort: undefined });
          return { ok: false, error: fr.error };
        }
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, variants: fr.data.variants, status: "fissioned" as ProjectStatus }
              : p,
          ),
        }));
        setAsync(set, key, { status: "success", abort: undefined });
        toast.success(`已生成 ${fr.data.variants.length} 个裂变变体`);
        return { ok: true };
      },

      cancelFission: (projectId) => {
        const key = `fission-${projectId}`;
        get().async[key]?.abort?.();
        setAsync(set, key, { status: "idle", abort: undefined });
      },

      /* ---------- 分发 ---------- */
      distribute: async (projectId, variantIds, channelIds, caption) => {
        if (channelIds.length === 0) {
          toast.error("请至少选择一个已授权渠道");
          return { ok: false, error: "未选择渠道" };
        }
        const key = `distribute-${projectId}`;
        const controller = new AbortController();
        setAsync(set, key, {
          status: "loading",
          error: undefined,
          abort: () => controller.abort(),
        });

        // 先创建 queued 任务，UI 立即可见
        const newTasks: DistributionTask[] = [];
        variantIds.forEach((variantId) =>
          channelIds.forEach((channelId) =>
            newTasks.push({
              id: `t-${Date.now()}-${variantId}-${channelId}`,
              variantId,
              projectId,
              channelId,
              status: "queued",
              caption,
            }),
          ),
        );
        set((s) => ({
          tasks: [...newTasks, ...s.tasks],
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, status: "distributed" as ProjectStatus }
              : p,
          ),
          pendingDistribution: null,
        }));

        const r = await clipService.distribute({
          projectId,
          variantIds,
          channelIds,
          caption,
          taskIds: newTasks.map((t) => t.id),
          signal: controller.signal,
          onTaskUpdate: (taskId, status, stats) =>
            set((s) => ({
              tasks: s.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      status,
                      stats: stats ?? t.stats,
                      publishedAt:
                        status === "published"
                          ? new Date().toLocaleString("zh-CN", { hour12: false })
                          : t.publishedAt,
                    }
                  : t,
              ),
            })),
        });
        const dr = unwrap(r);
        if (!dr.ok) {
          // 整体失败/取消：把仍处于 queued/publishing 的本次任务标记 failed
          set((s) => ({
            tasks: s.tasks.map((t) =>
              newTasks.some((nt) => nt.id === t.id) &&
              (t.status === "queued" || t.status === "publishing")
                ? { ...t, status: "failed" as const }
                : t,
            ),
          }));
          setAsync(set, key, { status: "error", error: dr.error, abort: undefined });
          if (!controller.signal.aborted) toast.error(dr.error);
          return { ok: false, error: dr.error };
        }
        setAsync(set, key, { status: "success", abort: undefined });
        toast.success(`已提交 ${newTasks.length} 个分发任务`);
        return { ok: true };
      },

      retryTask: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        const key = `retry-${taskId}`;
        const controller = new AbortController();
        setAsync(set, key, {
          status: "loading",
          abort: () => controller.abort(),
        });
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, status: "queued" as const, stats: undefined } : t,
          ),
        }));
        // 重新走单任务状态推进
        (async () => {
          const r = await clipService.distribute({
            projectId: task.projectId,
            variantIds: [task.variantId],
            channelIds: [task.channelId],
            caption: task.caption,
            taskIds: [task.id],
            signal: controller.signal,
            onTaskUpdate: (tid, status, stats) =>
              set((s) => ({
                tasks: s.tasks.map((t) =>
                  t.id === tid
                    ? {
                        ...t,
                        status,
                        stats: stats ?? t.stats,
                        publishedAt:
                          status === "published"
                            ? new Date().toLocaleString("zh-CN", { hour12: false })
                            : t.publishedAt,
                      }
                    : t,
                ),
              })),
          });
          const dr = unwrap(r);
          if (!dr.ok) {
            set((s) => ({
              tasks: s.tasks.map((t) =>
                t.id === taskId && (t.status === "queued" || t.status === "publishing")
                  ? { ...t, status: "failed" as const }
                  : t,
              ),
            }));
            setAsync(set, key, { status: "error", error: dr.error, abort: undefined });
            if (!controller.signal.aborted) toast.error(dr.error);
          } else {
            setAsync(set, key, { status: "success", abort: undefined });
          }
        })();
        toast.info("任务已重新加入队列");
      },

      cancelTask: (taskId) => {
        // 若有进行中的 retry abort 它
        const retryAsync = get().async[`retry-${taskId}`];
        retryAsync?.abort?.();
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId &&
            (t.status === "queued" || t.status === "publishing")
              ? { ...t, status: "failed" as const }
              : t,
          ),
          async: Object.fromEntries(
            Object.entries(s.async).filter(([k]) => k !== `retry-${taskId}`),
          ),
        }));
      },

      /* ---------- 渠道 ---------- */
      reconnectChannel: async (channelId) => {
        const key = `channel-${channelId}`;
        setAsync(set, key, { status: "loading" });
        const r = await clipService.connectChannel(channelId);
        const cr = unwrap(r);
        if (!cr.ok) {
          setAsync(set, key, { status: "error", error: cr.error });
          toast.error(cr.error);
          return;
        }
        set((s) => ({
          channels: s.channels.map((c) =>
            c.id === channelId ? { ...c, authStatus: "connected" } : c,
          ),
        }));
        setAsync(set, key, { status: "success" });
        toast.success("渠道已重新授权");
      },

      disconnectChannel: async (channelId) => {
        const key = `channel-${channelId}`;
        setAsync(set, key, { status: "loading" });
        const r = await clipService.disconnectChannel(channelId);
        const cr = unwrap(r);
        if (!cr.ok) {
          setAsync(set, key, { status: "error", error: cr.error });
          toast.error(cr.error);
          return;
        }
        set((s) => ({
          channels: s.channels.map((c) =>
            c.id === channelId ? { ...c, authStatus: "disconnected" } : c,
          ),
        }));
        setAsync(set, key, { status: "success" });
        toast.info("渠道已解绑");
      },
    }),
    {
      name: "clipforge-store",
      // analysisProgress 不持久化：它只是临时进度，刷新后由 Studio effect 重新触发分析
      partialize: (state) => ({
        projects: state.projects,
        channels: state.channels,
        tasks: state.tasks,
        pendingDistribution: state.pendingDistribution,
      }),
    },
  ),
);

function upsertVariant(list: Variant[], v: Variant): Variant[] {
  const idx = list.findIndex((x) => x.id === v.id);
  if (idx === -1) return [...list, v];
  const next = [...list];
  next[idx] = v;
  return next;
}
