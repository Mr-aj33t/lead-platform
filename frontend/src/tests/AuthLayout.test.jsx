import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import AuthLayout from '../layouts/AuthLayout';

describe('AuthLayout', () => {
  test('redirects to login when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <AuthLayout />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});
