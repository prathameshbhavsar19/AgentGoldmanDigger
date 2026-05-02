import { create } from 'zustand'
import type { WsEvent } from '../lib/ws'

export type StepStatus = 'pending' | 'active' | 'completed' | 'error' | 'input-needed'
export type CanvasStatus = 'idle' | 'streaming' | 'building' | 'ready' | 'failed'

export interface ActivityStep {
  stepId: string
  phase: string
  label: string
  status: StepStatus
  currentThought: string  // accumulates thought deltas while active
  summary: string         // set on completion
  inputPrompt?: string
  inputOptions?: string[]
}

export interface CanvasModule {
  moduleId: string
  type: string
  priority: number
  props: Record<string, unknown>
  updating: boolean
}

interface CanvasStore {
  jobId: string | null
  status: CanvasStatus
  steps: ActivityStep[]
  modules: CanvasModule[]
  selectedOption: string | null
  userName: string | null

  setJobId: (id: string) => void
  setUserName: (name: string) => void
  handleEvent: (event: WsEvent) => void
  selectOption: (id: string | null) => void
  reset: () => void
}

export const useCanvasStore = create<CanvasStore>()((set, get) => ({
  jobId: null,
  status: 'idle',
  steps: [],
  modules: [],
  selectedOption: null,
  userName: null,

  setJobId: (id) => set({ jobId: id, status: 'idle', steps: [], modules: [], selectedOption: null }),
  setUserName: (name) => set({ userName: name }),

  handleEvent: (event: WsEvent) => {
    const s = get()
    switch (event.event_type) {
      case 'analysis_started':
        set({ status: 'streaming', steps: [], modules: [] })
        break

      case 'activity_step_started': {
        const newStep: ActivityStep = {
          stepId: event.stepId as string,
          phase: event.phase as string,
          label: event.label as string,
          status: 'active',
          currentThought: '',
          summary: '',
        }
        set({
          steps: s.steps
            .map(st => st.status === 'active' ? { ...st, status: 'pending' as StepStatus } : st)
            .concat(newStep),
        })
        break
      }

      case 'activity_thought_delta': {
        const { stepId, delta } = event as { stepId: string; delta: string; event_type: string }
        set({
          steps: s.steps.map(st =>
            st.stepId === stepId
              ? { ...st, currentThought: st.currentThought + delta }
              : st
          ),
        })
        break
      }

      case 'activity_step_completed': {
        const { stepId, summary } = event as { stepId: string; summary: string; event_type: string }
        set({
          steps: s.steps.map(st =>
            st.stepId === stepId
              ? { ...st, status: 'completed', summary }
              : st
          ),
        })
        break
      }

      case 'canvas_module_updating': {
        const { moduleId } = event as { moduleId: string; event_type: string }
        set({
          modules: s.modules.map(m =>
            m.moduleId === moduleId ? { ...m, updating: true } : m
          ),
        })
        break
      }

      case 'canvas_generation_started':
        set({ status: 'building' })
        break

      case 'canvas_module_ready': {
        const mod = (event as { module: { type: string; priority: number; props: Record<string, unknown>; moduleId?: string }; event_type: string }).module
        const moduleId = mod.moduleId ?? `${mod.type}-${mod.priority}`
        const existing = s.modules.findIndex(m => m.moduleId === moduleId || m.type === mod.type)
        const newMod: CanvasModule = { moduleId, type: mod.type, priority: mod.priority, props: mod.props, updating: false }
        const updated =
          existing >= 0
            ? s.modules.map((m, i) => (i === existing ? newMod : m))
            : [...s.modules, newMod].sort((a, b) => a.priority - b.priority)
        set({ modules: updated })
        break
      }

      case 'analysis_completed':
        set({ status: 'ready' })
        break

      case 'analysis_failed': {
        const { stepId, message } = event as { stepId?: string; message: string; event_type: string }
        set({
          status: 'failed',
          steps: stepId
            ? s.steps.map(st => st.stepId === stepId ? { ...st, status: 'error', summary: message } : st)
            : s.steps,
        })
        break
      }

      case 'needs_user_input': {
        const { stepId, prompt, options } = event as { stepId: string; prompt: string; options: string[]; event_type: string }
        set({
          steps: s.steps.map(st =>
            st.stepId === stepId
              ? { ...st, status: 'input-needed', inputPrompt: prompt, inputOptions: options }
              : st
          ),
        })
        break
      }
    }
  },

  selectOption: (id) => set({ selectedOption: id }),
  reset: () => set({ jobId: null, status: 'idle', steps: [], modules: [], selectedOption: null }),
}))
