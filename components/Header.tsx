// components/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Logo from '../assets/img/Logo.png';
import {
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaHome,
  FaUsers,
  FaChartBar,
  FaCog,
} from 'react-icons/fa';

interface HeaderProps {
  userName?: string;
}

export default function Header({ userName = 'Usuário Admin' }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (path: string) =>
    pathname === path
      ? 'text-[#1c7d87] font-semibold'
      : 'text-gray-700 hover:text-[#007cb2]';

  // valida sessão
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/'); // volta pro login
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie =
      'authToken=; Path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="mx-4 lg:mx-[20%] py-4 px-6 flex justify-between items-center">
        {/* logo */}
        <div className="flex items-center">
          <Link href="/home" className="flex items-center">
            <Image src={Logo} height={150} width={150} alt="Logo" />
          </Link>
        </div>

        {/* Menu Desktop */}
        <nav className="hidden md:flex space-x-6">
          <Link href="/home" className={`font-medium flex items-center ${isActive('/home')}`}>
            <FaHome className="mr-1" /> Home
          </Link>
          <Link href="/agenda" className={`font-medium flex items-center ${isActive('/agenda')}`}>
            <FaUsers className="mr-1" /> Agenda
          </Link>
          <Link href="/financeiro" className={`font-medium flex items-center ${isActive('/financeiro')}`}>
            <FaChartBar className="mr-1" /> Financeiro
          </Link>
          <Link href="/funcionarios" className={`font-medium flex items-center ${isActive('/funcionarios')}`}>
            <FaUsers className="mr-1" /> Funcionários
          </Link>
          <Link href="/usuarios" className={`font-medium flex items-center ${isActive('/usuarios')}`}>
            <FaUsers className="mr-1" /> Usuários
          </Link>
          <Link href="/config" className={`font-medium flex items-center ${isActive('/config')}`}>
            <FaCog className="mr-1" /> Configurações
          </Link>
        </nav>

        {/* User + logout */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-gray-700">
            <FaUser className="text-[#1c7d87]" />
            <span className="hidden lg:inline">{userName}</span>
          </div>

          <button
            className="p-2 text-gray-500 hover:text-red-500 transition-colors hidden md:block"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
          </button>

          {/* Mobile menu button */}
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
              href="/home"
              className={`block font-medium flex items-center ${isActive('/home')}`}
              onClick={closeMenu}
            >
              <FaHome className="mr-2" /> Home
            </Link>
            <Link
              href="/agenda"
              className={`block font-medium flex items-center ${isActive('/agenda')}`}
              onClick={closeMenu}
            >
              <FaUsers className="mr-2" /> Agenda
            </Link>
            <Link
              href="/receber"
              className={`block font-medium flex items-center ${isActive('/receber')}`}
              onClick={closeMenu}
            >
              <FaChartBar className="mr-2" /> Financeiro
            </Link>
            <Link
              href="/funcionarios"
              className={`block font-medium flex items-center ${isActive('/funcionarios')}`}
              onClick={closeMenu}
            >
              <FaUsers className="mr-2" /> Funcionários
            </Link>
            <Link
              href="/usuarios"
              className={`block font-medium flex items-center ${isActive('/usuarios')}`}
              onClick={closeMenu}
            >
              <FaUsers className="mr-2" /> Usuários
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
                handleLogout();
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

