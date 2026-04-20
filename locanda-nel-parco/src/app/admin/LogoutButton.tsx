'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-gray-400 hover:text-white transition px-2 py-1"
    >
      Esci
    </button>
  );
}
