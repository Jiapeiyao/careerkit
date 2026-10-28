import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "CareerKit",
  description: "Turn your career materials into a resume for your target role.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className="flex min-h-svh flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
