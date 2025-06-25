import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { SearchProvider } from "@/contexts/search-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Easel - AI-Powered Azure Resource Management",
  description:
    "Simplify Azure resource provisioning and management with AI-powered recommendations and elegant dashboards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SearchProvider>{children}</SearchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
