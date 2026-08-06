import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Channel,
  DistributionTask,
  Highlight,
  Project,
  ProjectStatus,
  Variant,
} from "@/types";
import {
  channels as seedChannels,
  distributionTasks as seedTasks,
  projects as seedProjects,
  generateHighlights,
  pickThumb,
} from "@/data/mock";

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
  // 分析进度：projectId -> 阶段索引(0-4) 与百分比
  analysisProgress: Record<string, { stage: number; percent: number }>;

  toggleHighlight: (projectId: string, highlightId: string) => void;
  selectAllHighlights: (projectId: string, value: boolean) => void;
  generateVariants: (projectId: string) => void;
  saveVariants: (projectId: string, variants: Variant[]) => void;
  distribute: (
    projectId: string,
    variantIds: string[],
    channelIds: string[],
    caption: string,
  ) => void;
  setProjectStatus: (projectId: string, status: ProjectStatus) => void;
  addProject: (file: UploadFileInfo) => string;
  startAnalysis: (projectId: string) => void;
  reconnectChannel: (channelId: string) => void;
  getProject: (projectId: string) => Project | undefined;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: seedProjects,
      channels: seedChannels,
      tasks: seedTasks,
      analysisProgress: {},

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

      generateVariants: (projectId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id !== projectId
              ? p
              : { ...p, status: "fissioned" as ProjectStatus },
          ),
        })),

      saveVariants: (projectId, variants) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id !== projectId ? p : { ...p, variants },
          ),
        })),

      distribute: (projectId, variantIds, channelIds, caption) => {
        const newTasks: DistributionTask[] = [];
        variantIds.forEach((variantId) => {
          channelIds.forEach((channelId) => {
            newTasks.push({
              id: `t-${Date.now()}-${variantId}-${channelId}`,
              variantId,
              projectId,
              channelId,
              status: "queued",
              caption,
            });
          });
        });
        set((state) => ({
          tasks: [...newTasks, ...state.tasks],
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, status: "distributed" as ProjectStatus }
              : p,
          ),
        }));
      },

      setProjectStatus: (projectId, status) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, status } : p,
          ),
        })),

      addProject: (file) => {
        const id = `p-${Date.now()}`;
        const seed = Date.now() % 6;
        set((state) => ({
          projects: [
            {
              id,
              title: file.title,
              videoUrl: "",
              duration: file.duration,
              status: "analyzing" as ProjectStatus,
              thumbnail: pickThumb(seed),
              uploadedAt: new Date().toLocaleString("zh-CN", {
                hour12: false,
              }),
              source: `${file.source} · ${file.sizeLabel}`,
              highlights: [],
              variants: [],
            },
            ...state.projects,
          ],
          analysisProgress: {
            ...get().analysisProgress,
            [id]: { stage: 0, percent: 0 },
          },
        }));
        return id;
      },

      startAnalysis: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project || project.highlights.length > 0) return;

        // 模拟 5 阶段分析流程，逐阶段推进进度
        const stages = 5; // uploading / transcoding / detecting / subtitling / done
        const stageDuration = 900; // 每阶段基础时长(ms)
        let elapsed = 0;
        const totalDuration = stages * stageDuration;

        const interval = setInterval(() => {
          elapsed += 80;
          const percent = Math.min(100, (elapsed / totalDuration) * 100);
          const stage = Math.min(stages - 1, Math.floor(percent / 20));

          set((state) => ({
            analysisProgress: {
              ...state.analysisProgress,
              [projectId]: { stage, percent },
            },
          }));

          if (percent >= 100) {
            clearInterval(interval);
            // 填充高光并切换状态
            set((state) => {
              const cur = state.projects.find((p) => p.id === projectId);
              if (!cur || cur.highlights.length > 0) return state;
              const highlights = generateHighlights(
                projectId,
                cur.duration || 1800,
              );
              // 默认选中置信度 > 0.85 的片段
              highlights.forEach((h) => {
                if (h.confidence > 0.85) h.selected = true;
              });
              const { [projectId]: _removed, ...rest } = state.analysisProgress;
              void _removed;
              return {
                projects: state.projects.map((p) =>
                  p.id === projectId
                    ? { ...p, highlights, status: "ready" as ProjectStatus }
                    : p,
                ),
                analysisProgress: rest,
              };
            });
          }
        }, 80);
      },

      reconnectChannel: (channelId) =>
        set((state) => ({
          channels: state.channels.map((c) =>
            c.id === channelId
              ? { ...c, authStatus: "connected" as const }
              : c,
          ),
        })),
    }),
    {
      name: "clipforge-store",
      partialize: (state) => ({
        projects: state.projects,
        channels: state.channels,
        tasks: state.tasks,
      }),
    },
  ),
);

export type { Highlight };
