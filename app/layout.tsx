import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk, Inter } from "next/font/google";
import { CourseGuideChat } from "@/components/course-guide-chat";
import { ThemeProvider } from "@/components/theme-provider";
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
    images: [
      {
        url: "/icons/favicon-150.png",
        width: 150,
        height: 150,
        alt: "Omni AI",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Omni AI",
    description:
      "Find the right AI and technology courses, learn at your own pace, and track your progress with Omni AI.",
    images: ["/icons/favicon-150.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/favicon-150.png", sizes: "150x150", type: "image/png" },
      { url: "/icons/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/favicon-150.png", sizes: "150x150", type: "image/png" },
    ],
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
      suppressHydrationWarning
      className={`${inter.variable} ${headingFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster />
          <CourseGuideChat />
        </ThemeProvider>
      </body>
    </html>
  );
}

