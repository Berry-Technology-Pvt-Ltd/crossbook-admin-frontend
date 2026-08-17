import "./globals.css";
import Providers from "../shared/components/Providers";

export const metadata = {
  title: "CrossBook Admin Command Center",
  description: "Enterprise System Administration Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-purple-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
