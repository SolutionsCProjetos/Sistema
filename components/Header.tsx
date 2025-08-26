// components/Header.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Logo from '../assets/img/Logo.png'
import { FaUser, FaSignOutAlt, FaBars, FaTimes, FaHome, FaUsers, FaChartBar, FaCog } from 'react-icons/fa';

interface HeaderProps {
  userName?: string;
}

export default function Header({ userName = "Usuário Admin" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    return pathname === path ? 'text-[#1c7d87] font-semibold' : 'text-gray-700 hover:text-[#007cb2]';
  };

  return (
    <header className="bg-white shadow-md">
      <div className="mx-4 lg:mx-[20%] py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/home" className="flex items-center">
            <Image src={Logo} height={150} width={150} alt='Logo'/>
          </Link>
        </div>

        {/* Menu Desktop */}
        <nav className="hidden md:flex space-x-6">
          <Link 
            href="/home" 
            className={`font-medium flex items-center ${isActive('/home')}`}
          >
            <FaHome className="mr-1" /> Home
          </Link>
          {/* <Link 
            href="/clientes" 
            className={`font-medium flex items-center ${isActive('/clientes')}`}
          >
            <FaUsers className="mr-1" /> Clientes
          </Link> */}
          {/* <Link 
            href="/relatorios" 
            className={`font-medium flex items-center ${isActive('/relatorios')}`}
          >
            <FaChartBar className="mr-1" /> Relatórios
          </Link> */}
          <Link 
            href="/config" 
            className={`font-medium flex items-center ${isActive('/config')}`}
          >
            <FaCog className="mr-1" /> Configurações
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-gray-700">
            <FaUser className="text-[#1c7d87]" />
            <span className="hidden lg:inline">{userName}</span>
          </div>
          
          <button 
            className="p-2 text-gray-500 hover:text-red-500 transition-colors hidden md:block"
            onClick={() => {
              // Aqui você implementaria a lógica de logout
              console.log('Logout clicked');
            }}
          >
            <FaSignOutAlt />
          </button>

          {/* Menu Mobile Button */}
          <button 
            className="p-2 text-gray-700 md:hidden"
            onClick={toggleMenu}
            aria-label="Abrir menu"
          >
            {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-6 py-4 space-y-4">
            <Link 
              href="/" 
              className={`block font-medium flex items-center ${isActive('/')}`}
              onClick={closeMenu}
            >
              <FaHome className="mr-2" /> Home
            </Link>
            <Link 
              href="/clientes" 
              className={`block font-medium flex items-center ${isActive('/clientes')}`}
              onClick={closeMenu}
            >
              <FaUsers className="mr-2" /> Clientes
            </Link>
            <Link 
              href="/relatorios" 
              className={`block font-medium flex items-center ${isActive('/relatorios')}`}
              onClick={closeMenu}
            >
              <FaChartBar className="mr-2" /> Relatórios
            </Link>
            <Link 
              href="/config" 
              className={`block font-medium flex items-center ${isActive('/config')}`}
              onClick={closeMenu}
            >
              <FaCog className="mr-2" /> Configurações
            </Link>
            
            <div className="pt-4 border-t border-gray-200 flex items-center space-x-2 text-gray-700">
              <FaUser className="text-[#1c7d87]" />
              <span>{userName}</span>
            </div>
            
            <button 
              className="w-full text-left text-gray-700 hover:text-red-500 transition-colors flex items-center"
              onClick={() => {
                // Aqui você implementaria a lógica de logout
                console.log('Logout clicked');
                closeMenu();
              }}
            >
              <FaSignOutAlt className="mr-2" /> Sair
            </button>
          </div>
        </div>
      )}
    </header>
  );
}