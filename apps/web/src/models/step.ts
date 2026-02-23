export type StepId = string;

export interface Step {
  id: StepId;
  taskId: string;
  title: string;
  isCompleted: boolean;
  order: number;
  createdAt: string;
}
