import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerKit",
  description: "Turn your career materials into a resume for your target role.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="flex min-h-svh flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
