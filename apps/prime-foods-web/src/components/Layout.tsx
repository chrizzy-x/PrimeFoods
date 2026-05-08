import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <main className="flex-1 mx-auto w-full max-w-app pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
