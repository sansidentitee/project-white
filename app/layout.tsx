import "./globals.css";
import "./white-os.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import { ProjectProvider } from "@/components/ProjectProvider";
import { TradingProvider } from "@/components/TradingProvider";
import { LifeProvider } from "@/components/LifeProvider";
import { SaveProvider } from "@/components/SaveProvider";
import { ComfortProvider } from "@/components/ComfortProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WorldProvider } from "@/components/WorldProvider";

export const metadata: Metadata = {
  title: "Project White — Personal OS",
  description:
    "Un OS personnel minimaliste pour la scolarité, le quotidien, le deen, la finance et la vitalité.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <WorldProvider>
            <AuthProvider>
              <SaveProvider>
                <ProjectProvider>
                  <TradingProvider>
                    <LifeProvider>
                      <ComfortProvider>{children}</ComfortProvider>
                    </LifeProvider>
                  </TradingProvider>
                </ProjectProvider>
              </SaveProvider>
            </AuthProvider>
          </WorldProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import "./academic-v3.css";
import "./universes.css";
import "./progress.css";
import "./comfort.css";
