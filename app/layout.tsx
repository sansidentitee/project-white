import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthProvider';
import { ProjectProvider } from '@/components/ProjectProvider';
import { TradingProvider } from '@/components/TradingProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Project White',
  description: 'Dashboard personnel minimaliste pour les études et le journal de trading.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ProjectProvider>
              <TradingProvider>{children}</TradingProvider>
            </ProjectProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
