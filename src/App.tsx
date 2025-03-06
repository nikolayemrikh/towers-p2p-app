import { FC } from 'react';
import { StrictMode } from 'react';

import { BrowserRouter } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CssBaseline, Stack } from '@mui/material';
import { Routes } from './Routes';
import { ThemeProvider } from './core/theme/ThemeProvider';
import { MIN_WIDTH } from './core/theme/constants';

const queryClient = new QueryClient();

export const App: FC = () => {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CssBaseline enableColorScheme />
          <Stack height="100%" minWidth={MIN_WIDTH}>
            <BrowserRouter>
              <Routes />
            </BrowserRouter>
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  );
};
