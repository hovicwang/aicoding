import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Channel,
  DistributionTask,
  Highlight,
  Project,
  ProjectStatus,
} from "@/types";
import {
  channels as seedChannels,
  distributionTasks as seedTasks,
  projects as seedProjects,
} from "@/data/mock";

interface ProjectState {
  projects: Project[];
  channels: Channel[];
  tasks: DistributionTask[];
  toggleHighlight: (projectId: string, highlightId: string) => void;
  selectAllHighlights: (projectId: string, value: boolean) => void;
  generateVariants: (projectId: string) => void;
  distribute: (
    projectId: string,
    variantIds: string[],
    channelIds: string[],
    caption: string,
  ) => void;
  setProjectStatus: (projectId: string, status: ProjectStatus) => void;
  addProject: (title: string) => string;
  reconnectChannel: (channelId: string) => void;
  getProject: (projectId: string) => Project | undefined;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: seedProjects,
      channels: seedChannels,
      tasks: seedTasks,

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
                  status:
                    p.highlights.some((h) => h.id === highlightId && !h.selected)
                      ? "clipped"
                      : p.status,
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

      addProject: (title) => {
        const id = `p-${Date.now()}`;
        set((state) => ({
          projects: [
            {
              id,
              title,
              videoUrl: "",
              duration: 0,
              status: "analyzing" as ProjectStatus,
              thumbnail: "",
              uploadedAt: new Date().toLocaleString("zh-CN", {
                hour12: false,
              }),
              source: "上传中 · 等待分析",
              highlights: [],
              variants: [],
            },
            ...state.projects,
          ],
        }));
        return id;
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
