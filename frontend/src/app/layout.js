import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import LGPDConsent from "../components/LGPDConsent/LGPDConsent";
import { Toaster } from "react-hot-toast";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Elena Imóveis | Imóveis de Alto Padrão",
  description: "Encontre os melhores imóveis de luxo, casas em condomínios fechados, coberturas e apartamentos com a Elena Imóveis.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #1e293b',
              },
            }}
          />
          <Navbar />
          <main style={{ minHeight: '80vh' }}>{children}</main>
          <Footer />
          <LGPDConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
