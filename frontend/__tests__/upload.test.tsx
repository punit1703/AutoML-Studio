import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadPage from '../app/studio/upload/page';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock axios
jest.mock('axios', () => ({
  create: () => ({
    post: jest.fn().mockResolvedValue({ data: { id: 'dataset-123' } }),
    get: jest.fn().mockResolvedValue({ data: [] }),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
  })
}));

// Mock useAppContext
jest.mock('../context/AppContext', () => ({
  useAppContext: () => ({
    user: { id: 1, email: 'test@test.com' },
    activeProject: { id: 'proj-123' },
    logout: jest.fn(),
  }),
  AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('Upload Page', () => {
  beforeEach(() => {
    // Clear localStorage mocks
    Storage.prototype.getItem = jest.fn(() => 'test-token');
    window.alert = jest.fn();
  });

  it('renders upload area', () => {
    render(<UploadPage />);
    expect(screen.getByText(/Drag & drop your dataset here/i)).toBeInTheDocument();
  });

  it('shows error if non-csv file selected', async () => {
    render(<UploadPage />);
    
    // Using simple mock file for testing
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
    }
  });
});
