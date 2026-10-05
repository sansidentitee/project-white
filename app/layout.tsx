import './globals.css';
import './neon.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthProvider';
import { ProjectProvider } from '@/components/ProjectProvider';
import { TradingProvider } from '@/components/TradingProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { WorldProvider } from '@/components/WorldProvider';

export const metadata: Metadata = {
  title: 'Project White',
  description: 'Dashboard personnel académique et financier.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <WorldProvider>
            <AuthProvider>
              <ProjectProvider>
                <TradingProvider>{children}</TradingProvider>
              </ProjectProvider>
            </AuthProvider>
          </WorldProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
