import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  ShieldAlert,
  LayoutDashboard,
  FilePlus,
  ClipboardList,
  Bell,
  User,
  LogOut,
  Building2,
  Sliders,
  CheckCircle,
  Menu,
  X,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export const DashboardLayout = ({ children, title, subtitle }) => {
  const { user, role, availableRoles, switchRole, switchDemoRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [role]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    }
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Build navigation items based on active role
  const getNavLinks = () => {
    if (role === 'officer') {
      return [
        { label: 'Officer Dashboard', path: '/officer/dashboard', icon: LayoutDashboard },
        { label: 'Assigned Complaints', path: '/officer/dashboard?tab=queue', icon: ClipboardList },
        { label: 'My Profile & Security', path: '/profile', icon: User }
      ];
    }
    if (role === 'department_admin' || role === 'super_admin') {
      return [
        { label: 'Admin Overview', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Department Analytics', path: '/admin/dashboard?tab=departments', icon: Building2 },
        { label: 'Grievance Matrix', path: '/admin/dashboard?tab=matrix', icon: Sliders },
        { label: 'My Profile & Security', path: '/profile', icon: User }
      ];
    }
    // Citizen defaults
    return [
      { label: 'My Grievances', path: '/citizen/dashboard', icon: LayoutDashboard },
      { label: 'File New Grievance', path: '/citizen/file-complaint', icon: FilePlus },
      { label: 'My Profile & Security', path: '/profile', icon: User }
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
            >
              {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-lg bg-gov-navy-900 flex items-center justify-center text-gov-teal-500 shadow-sm">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-gov-navy-900 tracking-tight text-lg">
                JanSahayak <span className="text-gov-teal-600 text-xs px-2 py-0.5 rounded bg-gov-teal-50 border border-gov-teal-200">AI</span>
              </span>
            </Link>
          </div>

          {/* Right Header items */}
          <div className="flex items-center space-x-4">
            {/* Quick evaluator role changer */}
            <div className="hidden sm:flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-600">Active Role:</span>
              <select
                value={role}
                onChange={(e) => {
                  switchDemoRole(e.target.value);
                  if (e.target.value === 'officer') navigate('/officer/dashboard');
                  else if (e.target.value === 'citizen') navigate('/citizen/dashboard');
                  else navigate('/admin/dashboard');
                }}
                className="bg-transparent text-xs font-bold text-gov-navy-900 focus:outline-none cursor-pointer"
              >
                <option value="citizen">👤 Citizen</option>
                <option value="officer">👮 Field Officer (PWD)</option>
                <option value="department_admin">🏛️ Dept Admin (MCD)</option>
                <option value="super_admin">⚡ Super Admin</option>
              </select>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-3 z-50">
                  <div className="px-4 pb-2 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-sm text-slate-800">Notifications</h3>
                    <span className="text-xs text-slate-500">{notifications.length} alerts</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No notifications yet.</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${!n.is_read ? 'bg-gov-teal-50/50' : ''}`}
                        >
                          <div className="flex justify-between font-semibold text-slate-800 mb-0.5">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive User Profile Dropdown Menu */}
            <div className="relative pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
                aria-expanded={showProfileMenu}
                aria-label="User account menu"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user?.full_name || 'User avatar'}
                    className="w-8 h-8 rounded-full object-cover border border-gov-teal-500 shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gov-navy-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {user?.full_name ? user.full_name.charAt(0) : 'U'}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {user?.full_name || 'Authenticated User'}
                  </div>
                  <div className="text-[10px] text-gov-teal-700 font-medium capitalize">
                    {role.replace('_', ' ')}
                  </div>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-gov-navy-900 truncate">
                      {user?.full_name || 'Authenticated User'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                      {user?.email}
                    </p>
                    <div className="mt-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gov-teal-50 text-gov-teal-800 border border-gov-teal-200 capitalize">
                      <span>{role.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-gov-teal-700 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>View & Edit Profile</span>
                    </Link>

                    {/* Multi-role quick switch if account has multiple roles */}
                    {availableRoles && availableRoles.length > 1 && (
                      <div className="px-4 py-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Switch Active Console:
                        </span>
                        <div className="space-y-1">
                          {availableRoles.map(r => (
                            <button
                              key={r}
                              type="button"
                              onClick={async () => {
                                await switchRole(r);
                                setShowProfileMenu(false);
                                if (r === 'officer') navigate('/officer/dashboard');
                                else if (r === 'citizen') navigate('/citizen/dashboard');
                                else navigate('/admin/dashboard');
                              }}
                              className={`w-full text-left text-xs px-2 py-1 rounded font-medium capitalize flex items-center justify-between ${
                                r === role ? 'bg-gov-teal-50 text-gov-teal-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span>{r.replace('_', ' ')}</span>
                              {r === role && <span className="text-[10px] text-gov-teal-600 font-bold">Active</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        setShowProfileMenu(false);
                        await logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop & Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          ></div>
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl p-5 flex flex-col justify-between z-10 animate-in slide-in-from-left">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-gov-navy-900 text-gov-teal-400 flex items-center justify-center font-bold">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-gov-navy-900 text-base">JanSahayak AI</span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile active role selector */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Switch Role:</span>
                <select
                  value={role}
                  onChange={(e) => {
                    switchDemoRole(e.target.value);
                    setMobileSidebarOpen(false);
                    if (e.target.value === 'officer') navigate('/officer/dashboard');
                    else if (e.target.value === 'citizen') navigate('/citizen/dashboard');
                    else navigate('/admin/dashboard');
                  }}
                  className="w-full bg-white text-xs font-semibold text-gov-navy-900 border border-slate-300 rounded p-1.5"
                >
                  <option value="citizen">👤 Citizen</option>
                  <option value="officer">👮 Field Officer (PWD)</option>
                  <option value="department_admin">🏛️ Dept Admin (MCD)</option>
                  <option value="super_admin">⚡ Super Admin</option>
                </select>
              </div>

              {/* Links */}
              <nav className="mt-4 space-y-1">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path.split('?')[0];
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive ? 'bg-gov-navy-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-1">
              <Link
                to="/"
                onClick={() => setMobileSidebarOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Back to Portal Home
              </Link>
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  logout();
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm sticky top-24">
            <div className="mb-4 pb-3 border-b border-slate-100">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Workspace Menu
              </div>
            </div>

            <nav className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path.split('?')[0];
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gov-navy-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 opacity-75" />}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-4 border-t border-slate-100 space-y-1">
              <Link
                to="/"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span>Back to Portal Home</span>
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h1 className="text-2xl font-extrabold text-gov-navy-900 tracking-tight">{title}</h1>}
              {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
