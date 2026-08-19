import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ProfileSetupPage from './ProfileSetupPage';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

const mockUpdateProfile = vi.fn();
const mockShowToast = vi.fn();

vi.mock('../store/authStore', () => ({
  default: () => ({
    user: {
      id: 'google-user-id',
      name: 'Google User',
      email: 'google@gmail.com',
      avatar: 'https://lh3.googleusercontent.com/pic',
      authProvider: 'google',
      baseCurrency: 'USD',
      onboardingComplete: false
    },
    updateProfile: mockUpdateProfile
  })
}));

vi.mock('../components/UI/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast })
}));

describe('ProfileSetupPage Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Pre-fills Google profile details where available (name, email, avatar)', async () => {
    render(<ProfileSetupPage />);

    // Name input should pre-fill from user.name
    const nameInput = screen.getByPlaceholderText('e.g. Supriyo Sen') as HTMLInputElement;
    expect(nameInput.value).toBe('Google User');

    // Display name should pre-fill from user.displayName or fallback to name
    const displayNameInput = screen.getByPlaceholderText('e.g. Supriyo') as HTMLInputElement;
    expect(displayNameInput.value).toBe('Google User');

    // Avatar url input should pre-fill from user.avatar
    const avatarInput = screen.getByPlaceholderText('https://example.com/avatar.jpg') as HTMLInputElement;
    expect(avatarInput.value).toBe('https://lh3.googleusercontent.com/pic');
  });

  test('Validates required fields in Step 1 before allowing transition to Step 2', async () => {
    render(<ProfileSetupPage />);

    const nameInput = screen.getByPlaceholderText('e.g. Supriyo Sen') as HTMLInputElement;
    const displayNameInput = screen.getByPlaceholderText('e.g. Supriyo') as HTMLInputElement;

    // Clear name inputs
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.change(displayNameInput, { target: { value: '' } });

    // Submit step 1 form
    const nextButton = screen.getByRole('button', { name: /Configure Workspace/i });
    fireEvent.click(nextButton);

    // Should block and show warning toast
    expect(mockShowToast).toHaveBeenCalledWith('Full name is required.', 'error');
    expect(screen.queryByText(/Financial Milestones/i)).not.toBeInTheDocument();
  });

  test('Permits transition to Step 2 when required details are complete', async () => {
    render(<ProfileSetupPage />);

    // Transition to step 2
    const nextButton = screen.getByRole('button', { name: /Configure Workspace/i });
    fireEvent.click(nextButton);

    // Step 2 content: "baseCurrency", "Configure financial goals"
    expect(screen.getByText(/Configure financial goals/i)).toBeInTheDocument();
  });

  test('Saves onboarding goals details optionally and triggers redirect to dashboard', async () => {
    render(<ProfileSetupPage />);

    // Step 1: click next
    fireEvent.click(screen.getByRole('button', { name: /Configure Workspace/i }));

    // Step 2: enter optional details
    const selectElements = screen.getAllByRole('combobox');
    const currencySelect = selectElements[0] as HTMLSelectElement;
    fireEvent.change(currencySelect, { target: { value: 'INR' } });

    const finishButton = screen.getByRole('button', { name: /Finish Setup/i });
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Google User',
        displayName: 'Google User',
        avatar: 'https://lh3.googleusercontent.com/pic',
        baseCurrency: 'INR',
        country: 'US',
        timezone: expect.any(String),
        monthlyIncome: 'MEDIUM',
        preferredGoal: 'TRACKING',
        shortTermGoal: '',
        longTermGoal: '',
        onboardingComplete: true
      });
      expect(mockShowToast).toHaveBeenCalledWith('Profile completed successfully! Welcome to Finova.', 'success');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
