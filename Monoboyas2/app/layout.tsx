import '@/app/ui/global.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      {/* Usamos 'font-segoe' que definimos en el config */}
      <body className="font-segoe antialiased">
        {children}
      </body>
    </html>
  );
}