import "./globals.css";

export const metadata = {
  title: "Fan Timeline Starter",
  description: "A time-driven interactive narrative starter"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
