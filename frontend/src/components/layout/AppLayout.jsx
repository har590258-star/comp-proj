import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileDrawer from './MobileDrawer';
import { useLocationSync } from '../../hooks/useLocationSync';

const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSyncing, lastSyncedAt } = useLocationSync();

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col text-slate-900 font-sans antialiased">
      {/* Edge-to-Edge Top Navigation Bar */}
      <Navbar
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
      />

      {/* Main SaaS Layout Area: Left-Anchored Sidebar + Fluid Content */}
      <div className="flex-1 flex w-full">
        {/* Left Sidebar (Desktop) */}
        <Sidebar />

        {/* Dynamic Page Content Canvas */}
        <main className="flex-1 min-w-0 px-3.5 py-4 sm:px-8 sm:py-8 lg:px-10 lg:py-8 pb-32 lg:pb-12">
          <div className="w-full max-w-[1700px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Slide-out Drawer */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default AppLayout;
