import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FloatingDock } from "@/components/ui/floating-dock";
import { LayoutDashboard, BookOpenText, LogOut, Calendar } from "lucide-react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YH Trading Journal",
  description: "Votre journal de trading personnalisé",
};

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-full w-full" />,
  },
  {
    title: "Journal",
    href: "/journal",
    icon: <BookOpenText className="h-full w-full" />,
  },
  {
    title: "Calendrier",
    href: "/calendar",
    icon: <Calendar className="h-full w-full" />,
  },
  {
    title: "Déconnexion",
    href: "/auth/signout", 
    icon: <LogOut className="h-full w-full" />,
  }
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${inter.variable} antialiased bg-black text-white`}
      >
        <main className="relative flex flex-col min-h-screen">
          <div className="flex-grow">{children}</div>
          <FloatingDock
            items={navItems}
            desktopClassName="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50"
            mobileClassName="fixed bottom-4 right-4 z-50"
          />
        </main>
      </body>
    </html>
  );
}
