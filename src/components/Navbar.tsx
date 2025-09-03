import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  MessageCircle, 
  Bell, 
  Search,
  Grid3X3,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Rocket,
  Menu,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const businessDropdownRef = useRef<HTMLDivElement>(null);

  // Get current user profile with real-time updates
  const { data: profile } = useQuery({
    queryKey: ['current-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .eq('id', user.id)
        .single();
      
      return {
        id: user.id,
        full_name: data?.full_name || null,
        email: user.email,
        created_at: user.created_at
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (businessDropdownRef.current && !businessDropdownRef.current.contains(event.target as Node)) {
        setShowBusinessDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'Network', path: '/network' },
    { icon: MessageCircle, label: 'Messages', path: '/messaging' },
    { icon: Bell, label: 'Notifications', path: '/notifications', hasNotification: true },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 py-1 overflow-hidden">
          {/* Left Section - Logo and Search */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            {/* TechPro Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2 sm:space-x-3 group">
              <div className="relative">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-primary rounded-xl flex items-center justify-center hover:shadow-glow transition-all duration-300 group-hover:scale-105">
                  <Rocket className="text-white w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div className="absolute -inset-1 bg-gradient-primary rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              </div>
              <div>
                <span className="text-lg sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  TechPro
                </span>
                <div className="hidden md:block text-xs text-muted-foreground font-medium tracking-wide">
                  Developer Hub
                </div>
              </div>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative flex-1 max-w-xs sm:max-w-sm mx-2 sm:mx-4">
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 sm:pl-10 pr-8 sm:pr-12 py-1.5 sm:py-2 bg-muted/80 border-0 rounded-lg text-xs sm:text-sm placeholder-muted-foreground focus:outline-none focus:bg-background transition-all duration-200"
                />
                <div className="hidden sm:flex absolute right-3 top-1/2 transform -translate-y-1/2 items-center space-x-1 text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">⌘</kbd>
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">K</kbd>
                </div>
              </div>
            </form>
          </div>

          {/* Center Section - Navigation Items */}
          <div className="hidden sm:flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex flex-col items-center px-2 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 group relative min-w-[50px] sm:min-w-[70px] ${
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <div className="relative mb-0.5 sm:mb-1">
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    {item.hasNotification && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-center hidden sm:block">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Right Section - Profile and Business */}
          <div className="hidden sm:flex items-center space-x-2 sm:space-x-6 flex-shrink-0">
            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
              >
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex items-center">
                  <span className="text-sm font-medium">{profile?.full_name || 'User'}</span>
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg py-2 z-50">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <User className="w-4 h-4 mr-3" />
                    View Profile
                  </Link>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Business/Tools Dropdown */}
            <div className="hidden sm:block border-l border-border pl-2 sm:pl-4" ref={businessDropdownRef}>
              <div className="relative">
                <button 
                  onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
                  className="flex items-center px-2 sm:px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                >
                  <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="text-sm font-medium hidden lg:block">Tools</span>
                  <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 ml-1 transition-transform duration-200 ${showBusinessDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showBusinessDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-lg py-2 z-50">
                    <div className="px-2">
                      <h4 className="text-sm font-medium text-foreground mb-2 px-2">Developer Tools</h4>
                      <Link
                        to="/analytics"
                        className="block px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                        onClick={() => setShowBusinessDropdown(false)}
                      >
                        Analytics Dashboard
                      </Link>
                      <Link
                        to="/api-docs"
                        className="block px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                        onClick={() => setShowBusinessDropdown(false)}
                      >
                        API Documentation
                      </Link>
                      <Link
                        to="/integrations"
                        className="block px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                        onClick={() => setShowBusinessDropdown(false)}
                      >
                        Integrations
                      </Link>
                      <Link
                        to="/admin"
                        className="block px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                        onClick={() => setShowBusinessDropdown(false)}
                      >
                        Admin Panel
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="sm:hidden bg-card border-t border-border">
          <div className="px-4 py-3 space-y-2">
            {/* Mobile Navigation Items */}
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <div className="relative">
                    <item.icon className="w-5 h-5" />
                    {item.hasNotification && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            {/* Mobile Profile Section */}
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-center space-x-3 px-3 py-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.email}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1 mt-2">
                <Link
                  to="/profile"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>View Profile</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleSignOut();
                  }}
                  className="flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
