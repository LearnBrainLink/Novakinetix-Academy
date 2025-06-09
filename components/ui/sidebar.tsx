"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';
import { supabase } from '@/lib/supabase';
import { Users, Video, Briefcase, BarChart3, Settings, Shield, Mail, FileText, Menu, X, Home, LogOut, GraduationCap } from 'lucide-react';

const navigationItems = [
  { title: 'Dashboard', href: '/admin', icon: Home, description: 'Overview and quick stats' },
  { title: 'User Management', href: '/admin/users', icon: Users, description: 'Manage all users and permissions' },
  { title: 'Content Moderation', href: '/admin/content', icon: FileText, description: 'Review and moderate content' },
  { title: 'Video Management', href: '/admin/videos', icon: Video, description: 'Upload and manage videos' },
  { title: 'Internship Management', href: '/admin/internships', icon: Briefcase, description: 'Manage internship programs' },
  { title: 'Applications', href: '/admin/applications', icon: Briefcase, description: 'Review internship applications' },
  { title: 'Analytics & Reports', href: '/admin/analytics', icon: BarChart3, description: 'View detailed analytics' },
  { title: 'Email Configuration', href: '/admin/email-config', icon: Mail, description: 'Configure email settings' },
  { title: 'Admin Setup', href: '/admin/setup', icon: Shield, description: 'Manage admin accounts' },
  { title: 'Settings', href: '/admin/settings', icon: Settings, description: 'System configuration' },
];

export function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const currentPage = navigationItems.find((item) => item.href === pathname);

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header with Large Logo */}
          <div className="flex items-center justify-center p-8 border-b border-gray-200">
            <Link href="/admin" className="flex items-center justify-center">
              <Logo variant="large" className="hover:scale-105 transition-transform duration-300" />
            </Link>
            <Button variant="ghost" size="sm" className="lg:hidden absolute top-4 right-4" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Admin Badge */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="text-center">
              <Badge className="bg-blue-600 text-white border-0 text-lg px-6 py-2">
                <GraduationCap className="w-5 h-5 mr-2" />
                Admin Panel
              </Badge>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="w-6 h-6 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-base">{item.title}</p>
                      <p className={`text-sm truncate ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 border-gray-300 text-gray-700 hover:bg-gray-100 transition-all duration-200 py-3"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-700 hover:bg-gray-100"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentPage?.title || 'Admin Dashboard'}</h1>
              <p className="text-base text-gray-500 font-medium mt-1">
                {currentPage?.description || 'Manage your NOVAKINETIX ACADEMY platform'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-green-100 text-green-700 border-green-200 font-medium text-base px-4 py-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              System Online
            </Badge>
          </div>
        </div>
      </header>
    </>
  );
}
