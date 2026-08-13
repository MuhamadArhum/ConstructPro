export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled';

export interface Project {
  id: string;
  code?: string;
  name: string;
  description?: string | null;
  clientId?: string | null;
  siteAddress?: string | null;
  startDate: string;
  endDate?: string | null;
  budget: number;
  spent: number;
  status: ProjectStatus;
  progress: number;
  managerName?: string | null;
  notes?: string | null;
  createdAt: string;
  client?: { id: string; name: string; companyName?: string | null } | null;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string | null;
}

export interface ProjectExpense {
  id: string;
  projectId: string;
  category: string;
  amount: number;
  date: string;
  description?: string | null;
}

export interface ProjectLabour {
  id: string;
  labourId: string;
  assignedAt: string;
  labour: { id: string; name: string; trade?: string | null; dailyWage: number };
}

export interface ProjectMachinery {
  id: string;
  machineryId: string;
  assignedAt: string;
  machinery: { id: string; name: string; model?: string | null; status: string };
}

export interface ProjectStats {
  budget: number;
  spent: number;
  remaining: number;
  progress: number;
  milestoneCount: number;
  completedMilestones: number;
  labourCount: number;
  machineryCount: number;
  expenseCount: number;
}

export interface ProjectDetail extends Project {
  milestones: ProjectMilestone[];
  expenses: ProjectExpense[];
  labours: ProjectLabour[];
  machinery: ProjectMachinery[];
}
