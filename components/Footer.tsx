// components/Footer.tsx
import { FaRegCopyright } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white mt-8">
      <div className="mx-[20%] py-6 px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <FaRegCopyright className="mr-2" />
            <span>{currentYear} Sistema de Gestão de Clientes. Todos os direitos reservados.</span>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-blue-300 transition-colors">Termos de Uso</a>
            <span className="text-gray-400">|</span>
            <a href="#" className="hover:text-blue-300 transition-colors">Política de Privacidade</a>
            <span className="text-gray-400">|</span>
            <a href="#" className="hover:text-blue-300 transition-colors">Suporte</a>
          </div>
        </div>
      </div>
    </footer>
  );
}