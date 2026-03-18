export interface Participant {
  id: string;
  name: string;
  costCenter: string | null;
  role: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GPTAction {
  action: string;
  responsible: string | null;
  actionOwner: string | null;
  account: string | null;
  deadline: string | null;
}

export interface GPTPain {
  description: string;
  solutions: string[];
  actions: GPTAction[];
}

export interface GPTAnalysisResponse {
  title: string;
  context: string;
  pains: GPTPain[];
}

export interface EditableSolution {
  tempId: string;
  description: string;
}

export interface EditablePain {
  tempId: string;
  description: string;
  solutions: EditableSolution[];
}

export type TodoStatus = 'Pendente' | 'Em andamento' | 'Concluido' | 'Cancelado';

export interface CreateTodoRequest {
  action: string;
  responsible?: string;
  actionOwner?: string;
  costCenter?: string;
  account?: string;
  deadline?: string;
  meetingDate: string;
  status?: TodoStatus;
  meetingId?: string;
}

export interface CreateMeetingRequest {
  title: string | null;
  date: string;
  transcription: string;
  context: string | null;
  participantIds: string[];
  pains: {
    description: string;
    solutions: string[];
    todos: Omit<CreateTodoRequest, 'meetingId'>[];
  }[];
  orphanTodos?: Omit<CreateTodoRequest, 'meetingId'>[];
}

export interface EditableTodo {
  tempId: string;
  action: string;
  responsible: string;
  actionOwner: string;
  costCenter: string;
  account: string;
  deadline: string;
  status: TodoStatus;
  painTempId: string | null;
  meetingDate?: string;
}

export type WizardStep =
  | 'participants'
  | 'recording'
  | 'transcription'
  | 'analysis'
  | 'pains-solutions'
  | 'todos'
  | 'save';

export interface WizardState {
  step: WizardStep;
  selectedParticipants: Participant[];
  audioBlob: Blob | null;
  audioFileName: string | null;
  transcription: string | null;
  analysis: GPTAnalysisResponse | null;
  editedPains: EditablePain[];
  editedTodos: EditableTodo[];
  title: string | null;
}

export interface MeetingListItem {
  id: string;
  title: string | null;
  date: string;
  createdAt: string;
  _count: { todos: number };
}

export interface ImportExcelRequest {
  title: string;
  date: string;
  todos: {
    action: string;
    responsible?: string;
    actionOwner?: string;
    costCenter?: string;
    account?: string;
    deadline?: string;
    meetingDate?: string;
    status?: TodoStatus;
  }[];
}

export interface DashboardFiltersState {
  costCenter: string;
  responsible: string;
  actionOwner: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  account: string;
}

export interface DashboardCounters {
  pendente: number;
  emAndamento: number;
  concluido: number;
  cancelado: number;
}
