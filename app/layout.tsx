import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk, Inter } from "next/font/google";
import { CourseGuideChat } from "@/components/course-guide-chat";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const headingFont = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Omni AI",
    template: "%s | Omni AI",
  },
  applicationName: "Omni AI",
  description:
    "Find the right AI and technology courses, learn at your own pace, and track your progress with Omni AI.",
  openGraph: {
    title: "Omni AI",
    description:
      "Find the right AI and technology courses, learn at your own pace, and track your progress with Omni AI.",
    siteName: "Omni AI",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Omni AI",
    description:
      "Find the right AI and technology courses, learn at your own pace, and track your progress with Omni AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${headingFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
        <CourseGuideChat />
      </body>
    </html>
  );
}

