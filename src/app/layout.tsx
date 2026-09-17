import type { Metadata } from "next";
import AppHeader from "./AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "FR Admin Portal",
  description: "Admin Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="appShell">
          <AppHeader />

          <div className="appMain">{children}</div>

          <footer className="appFooter">
            <span>FR Admin Portal</span>
            <span>All rights reserved.</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
