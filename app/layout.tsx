import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Singapore MRT Fare Calculator",
  description: "Calculate MRT fares between any two stations in Singapore's MRT network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            console.log('CSS Debug:');
            setTimeout(() => {
              const styles = Array.from(document.styleSheets);
              console.log('Total stylesheets:', styles.length);
              styles.forEach((sheet, i) => {
                try {
                  console.log(\`Sheet \${i}: \${sheet.href || 'inline'}\`);
                } catch (e) {
                  console.log(\`Sheet \${i}: [CORS protected]\`);
                }
              });
            }, 1000);
          `
        }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
} 