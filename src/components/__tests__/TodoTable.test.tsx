import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { TodoTable } from '../TodoTable';
import { useTodoTable } from '@/hooks/useTodoTable';
import type { EditableTodo, Participant, EditablePain } from '@/lib/types';

const mockParticipants: Participant[] = [
  {
    id: '1',
    name: 'João',
    costCenter: 'CC-001',
    role: 'Dev',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Maria',
    costCenter: 'CC-002',
    role: 'PM',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const mockPains: EditablePain[] = [
  { tempId: 'pain-1', description: 'Falta de documentação', solutions: [] },
  { tempId: 'pain-2', description: 'Deploy manual', solutions: [] },
];

const makeTodo = (overrides: Partial<EditableTodo> = {}): EditableTodo => ({
  tempId: 'todo-1',
  action: 'Criar documentação',
  responsible: 'João',
  actionOwner: 'Maria',
  costCenter: 'CC-001',
  account: 'Conta A',
  deadline: '2024-06-30',
  status: 'Pendente',
  painTempId: 'pain-1',
  ...overrides,
});

const defaultProps = {
  todos: [makeTodo()],
  onUpdateTodo: vi.fn(),
  onAddTodo: vi.fn(),
  onRemoveTodo: vi.fn(),
  participants: mockParticipants,
  pains: mockPains,
  meetingDate: '2024-03-15',
};

describe('TodoTable', () => {
  it('renders table with correct column headers', () => {
    render(<TodoTable {...defaultProps} />);

    expect(screen.getByText('Responsável')).toBeDefined();
    expect(screen.getByText('Resp. pela ação')).toBeDefined();
    expect(screen.getByText('Centro de custo')).toBeDefined();
    expect(screen.getByText('Data reunião')).toBeDefined();
    expect(screen.getByText('Conta')).toBeDefined();
    expect(screen.getByText('TO-DO (Ação)')).toBeDefined();
    expect(screen.getByText('Prazo')).toBeDefined();
    expect(screen.getByText('Dor relacionada')).toBeDefined();
    expect(screen.getByText('Status')).toBeDefined();
  });

  it('renders empty state when no todos', () => {
    render(<TodoTable {...defaultProps} todos={[]} />);
    expect(screen.getByText('Nenhum to-do adicionado')).toBeDefined();
  });

  it('renders todo data in input fields', () => {
    render(<TodoTable {...defaultProps} />);

    expect(screen.getByDisplayValue('João')).toBeDefined();
    expect(screen.getByDisplayValue('Criar documentação')).toBeDefined();
    expect(screen.getByDisplayValue('CC-001')).toBeDefined();
    expect(screen.getByDisplayValue('Conta A')).toBeDefined();
  });

  it('calls onUpdateTodo when editing action field', () => {
    const onUpdateTodo = vi.fn();
    render(<TodoTable {...defaultProps} onUpdateTodo={onUpdateTodo} />);

    const actionInput = screen.getByDisplayValue('Criar documentação');
    fireEvent.change(actionInput, { target: { value: 'Atualizar docs' } });
    expect(onUpdateTodo).toHaveBeenCalledWith('todo-1', 'action', 'Atualizar docs');
  });

  it('calls onAddTodo when clicking add button', () => {
    const onAddTodo = vi.fn();
    render(<TodoTable {...defaultProps} onAddTodo={onAddTodo} />);

    fireEvent.click(screen.getByText('Adicionar To-Do'));
    expect(onAddTodo).toHaveBeenCalledOnce();
  });

  it('calls onRemoveTodo when clicking delete button', () => {
    const onRemoveTodo = vi.fn();
    render(<TodoTable {...defaultProps} onRemoveTodo={onRemoveTodo} />);

    const svgIcons = document.querySelectorAll('svg.lucide-trash-2');
    expect(svgIcons.length).toBeGreaterThan(0);
    const deleteBtn = svgIcons[0].closest('button');
    expect(deleteBtn).not.toBeNull();
    fireEvent.click(deleteBtn!);
    expect(onRemoveTodo).toHaveBeenCalledWith('todo-1');
  });

  it('displays pain description from pains list', () => {
    render(<TodoTable {...defaultProps} />);
    expect(screen.getByText('Falta de documentação')).toBeDefined();
  });

  it('displays meeting date formatted', () => {
    render(<TodoTable {...defaultProps} meetingDate="2024-03-15" />);
    expect(screen.getByText('15/03/2024')).toBeDefined();
  });

  it('renders read-only mode without inputs', () => {
    render(<TodoTable {...defaultProps} readOnly />);

    expect(screen.queryByDisplayValue('João')).toBeNull();
    expect(screen.queryByText('Adicionar To-Do')).toBeNull();
    expect(screen.getByText('João')).toBeDefined();
    expect(screen.getByText('Criar documentação')).toBeDefined();
  });

  it('shows badge for status in read-only mode', () => {
    render(<TodoTable {...defaultProps} readOnly />);
    expect(screen.getByText('Pendente')).toBeDefined();
  });
});

describe('useTodoTable', () => {
  it('initializes with provided todos', () => {
    const initialTodos = [makeTodo()];
    const { result } = renderHook(() =>
      useTodoTable({ initialTodos })
    );
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].action).toBe('Criar documentação');
  });

  it('adds a new todo with defaults', () => {
    const { result } = renderHook(() => useTodoTable());

    act(() => {
      result.current.addTodo();
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].status).toBe('Pendente');
    expect(result.current.todos[0].action).toBe('');
    expect(result.current.todos[0].painTempId).toBeNull();
  });

  it('removes a todo by tempId', () => {
    const initialTodos = [makeTodo(), makeTodo({ tempId: 'todo-2' })];
    const { result } = renderHook(() =>
      useTodoTable({ initialTodos })
    );

    act(() => {
      result.current.removeTodo('todo-1');
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].tempId).toBe('todo-2');
  });

  it('updates a todo field', () => {
    const initialTodos = [makeTodo()];
    const { result } = renderHook(() =>
      useTodoTable({ initialTodos })
    );

    act(() => {
      result.current.updateTodo('todo-1', 'action', 'Nova ação');
    });

    expect(result.current.todos[0].action).toBe('Nova ação');
  });

  it('auto-fills costCenter when responsible matches a participant', () => {
    const initialTodos = [makeTodo({ responsible: '', costCenter: '' })];
    const { result } = renderHook(() =>
      useTodoTable({ initialTodos, participants: mockParticipants })
    );

    act(() => {
      result.current.updateTodo('todo-1', 'responsible', 'Maria');
    });

    expect(result.current.todos[0].responsible).toBe('Maria');
    expect(result.current.todos[0].costCenter).toBe('CC-002');
  });

  it('does not overwrite costCenter when responsible has no CC', () => {
    const participants: Participant[] = [
      { id: '3', name: 'Carlos', costCenter: null, role: null, createdAt: '', updatedAt: '' },
    ];
    const initialTodos = [makeTodo({ costCenter: 'CC-OLD' })];
    const { result } = renderHook(() =>
      useTodoTable({ initialTodos, participants })
    );

    act(() => {
      result.current.updateTodo('todo-1', 'responsible', 'Carlos');
    });

    expect(result.current.todos[0].costCenter).toBe('CC-OLD');
  });
});
