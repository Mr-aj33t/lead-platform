import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Login from '../pages/Login';

function renderWithProviders(ui) {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
}

describe('Login Page', () => {
  it('renders login form', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText(/sign in to lead platform/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows required validation on empty submit', async () => {
    renderWithProviders(<Login />);
    const button = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(button);
    expect(screen.getByLabelText(/email/i)).toBeInvalid();
  });
});
