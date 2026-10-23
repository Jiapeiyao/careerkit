import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerKit",
  description: "Turn your career materials into a resume for your target role.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
