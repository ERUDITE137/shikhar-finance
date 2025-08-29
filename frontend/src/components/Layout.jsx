import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Sheet, SheetContent } from './ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { 
  Menu, 
  Home, 
  CreditCard, 
  BarChart3, 
  FolderOpen, 
  Upload, 
  LogOut,
  TrendingUp,
  Wallet,
  Bell,
  Settings
} from 'lucide-react';

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const getPageTitle = (pathname) => {
    const titles = {
      '/dashboard': 'Dashboard',
      '/transactions': 'Transactions',
      '/analytics': 'Analytics',
      '/categories': 'Categories',
      '/upload': 'Upload Receipt'
    };
    return titles[pathname] || 'Dashboard';
  };

  const getPageSubtitle = (pathname) => {
    const subtitles = {
      '/dashboard': 'Overview of your financial activity',
      '/transactions': 'Manage and track your transactions',
      '/analytics': 'Insights and spending patterns',
      '/categories': 'Organize your expense categories',
      '/upload': 'Process receipts with AI technology'
    };
    return subtitles[pathname] || 'Welcome to your finance dashboard';
  };

  const menuItems = [
    { text: 'Dashboard', icon: Home, path: '/dashboard' },
    { text: 'Transactions', icon: CreditCard, path: '/transactions' },
    { text: 'Analytics', icon: BarChart3, path: '/analytics' },
    { text: 'Categories', icon: FolderOpen, path: '/categories' },
    { text: 'Upload Receipt', icon: Upload, path: '/upload' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className="flex h-full flex-col bg-white border-r border-secondary-200">
      {/* Logo Section */}
      <div className="flex h-20 items-center px-6 border-b border-secondary-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-lg">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-secondary-900">Shikar</h1>
            <p className="text-xs text-secondary-500 font-medium">Finance</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  if (mobile) setMobileOpen(false);
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                }`}
              >
                <Icon className={`h-5 w-5 transition-colors ${
                  isActive ? 'text-white' : 'text-secondary-400 group-hover:text-secondary-600'
                }`} />
                <span className="font-medium">{item.text}</span>
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-white/30" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Bottom Section */}
        <div className="mt-auto pt-6">
          <div className="rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 p-4 border border-primary-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-900">Pro Tip</span>
            </div>
            <p className="text-xs text-primary-700 leading-relaxed">
              Upload receipts regularly to track your spending patterns better.
            </p>
          </div>
        </div>
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Header */}
        <header className="flex h-20 items-center gap-4 bg-white border-b border-secondary-200 px-6 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-secondary-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5 text-secondary-600" />
          </Button>

          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">
                  {getPageTitle(location.pathname)}
                </h1>
                <p className="text-sm text-secondary-500 font-medium">
                  {getPageSubtitle(location.pathname)}
                </p>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-full hover:bg-secondary-100 p-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white text-sm font-semibold shadow-lg ring-2 ring-white ring-offset-2">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-secondary-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-secondary-500">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-danger-600 focus:text-danger-600">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
