import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ParticipantSelector } from '@/components/ParticipantSelector';
import type { Participant } from '@/lib/types';

const mockParticipants: Participant[] = [
  { id: '1', name: 'Alice', costCenter: 'CC-100', role: null, createdAt: '', updatedAt: '' },
  { id: '2', name: 'Bob', costCenter: null, role: null, createdAt: '', updatedAt: '' },
  { id: '3', name: 'Carlos', costCenter: 'CC-200', role: null, createdAt: '', updatedAt: '' },
];

vi.mock('@/lib/api', () => ({
  getParticipants: vi.fn().mockResolvedValue([
    { id: '1', name: 'Alice', costCenter: 'CC-100', role: null, createdAt: '', updatedAt: '' },
    { id: '2', name: 'Bob', costCenter: null, role: null, createdAt: '', updatedAt: '' },
    { id: '3', name: 'Carlos', costCenter: 'CC-200', role: null, createdAt: '', updatedAt: '' },
  ]),
  createParticipant: vi.fn().mockResolvedValue({
    id: '4', name: 'Diana', costCenter: 'CC-300', role: null, createdAt: '', updatedAt: '',
  }),
}));

describe('ParticipantSelector', () => {
  it('renders search input', async () => {
    render(
      <ParticipantSelector
        selectedParticipants={[]}
        onSelectionChange={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText('Buscar ou adicionar participante...')).toBeInTheDocument();
  });

  it('shows dropdown with participants on focus', async () => {
    render(
      <ParticipantSelector
        selectedParticipants={[]}
        onSelectionChange={vi.fn()}
      />
    );

    await waitFor(() => {
      // Wait for getParticipants to resolve
    });

    const input = screen.getByPlaceholderText('Buscar ou adicionar participante...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Ali' } });

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  it('renders selected participants as badges', () => {
    render(
      <ParticipantSelector
        selectedParticipants={[mockParticipants[0]]}
        onSelectionChange={vi.fn()}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('calls onSelectionChange when removing participant', () => {
    const onChange = vi.fn();
    render(
      <ParticipantSelector
        selectedParticipants={[mockParticipants[0]]}
        onSelectionChange={onChange}
      />
    );
    fireEvent.click(screen.getByLabelText('Remover Alice'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows add option for new name', async () => {
    render(
      <ParticipantSelector
        selectedParticipants={[]}
        onSelectionChange={vi.fn()}
      />
    );

    await waitFor(() => {});

    const input = screen.getByPlaceholderText('Buscar ou adicionar participante...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Diana' } });

    await waitFor(() => {
      expect(screen.getByText(/Adicionar "Diana"/)).toBeInTheDocument();
    });
  });

  it('shows cost center input when adding new participant', async () => {
    render(
      <ParticipantSelector
        selectedParticipants={[]}
        onSelectionChange={vi.fn()}
      />
    );

    await waitFor(() => {});

    const input = screen.getByPlaceholderText('Buscar ou adicionar participante...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Diana' } });

    await waitFor(() => {
      const addBtn = screen.getByText(/Adicionar "Diana"/);
      fireEvent.mouseDown(addBtn);
    });

    expect(screen.getByPlaceholderText('Centro de custo (opcional)')).toBeInTheDocument();
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
  });
});
