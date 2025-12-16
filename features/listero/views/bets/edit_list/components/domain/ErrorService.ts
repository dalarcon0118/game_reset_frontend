export interface ErrorState {
  isError: boolean;
  errorMessage: string;
}

export const createInitialErrorState = (): ErrorState => ({
  isError: false,
  errorMessage: '',
});

export class ErrorService {
  private state: ErrorState;
  private setState: (newState: Partial<ErrorState>) => void;

  constructor(initialState: ErrorState, setState: (newState: Partial<ErrorState>) => void) {
    this.state = initialState;
    this.setState = setState;
  }

  setError(message: string): void {
    this.setState({ isError: true, errorMessage: message });
  }

  clearError(): void {
    this.setState({ isError: false, errorMessage: '' });
  }

  getState(): ErrorState {
    return this.state;
  }
}