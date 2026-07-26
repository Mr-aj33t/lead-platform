import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import Leads from '../pages/Leads';

describe('Leads Page', () => {
  test('renders heading and new lead button', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Leads />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Leads')).toBeInTheDocument();
    expect(screen.getByText('+ New Lead')).toBeInTheDocument();
  });

  test('renders search input', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Leads />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });
});
