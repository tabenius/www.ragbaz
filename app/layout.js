// Root layout — only used by the built-in not-found page; every real page
// is a full HTML document served by the route handlers.
export const metadata = {
  title: "ragbaz",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
