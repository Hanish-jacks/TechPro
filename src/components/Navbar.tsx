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
  Rocket
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
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
        .select('id, username, full_name, avatar_url, bio, job_title, created_at')
        .eq('id', user.id)
        .single();
      
      return {
        ...(data || {}),
        email: user.email,
        id: user.id,
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 py-1">
          {/* Left Section - Logo and Search */}
          <div className="flex items-center space-x-4">
            {/* TechPro Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center hover:shadow-glow transition-all duration-300 group-hover:scale-105">
                  <Rocket className="text-white w-6 h-6" />
                </div>
                <div className="absolute -inset-1 bg-gradient-primary rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  TechPro
                </span>
                <div className="text-xs text-muted-foreground font-medium tracking-wide">
                  Developer Hub
                </div>
              </div>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative flex-1 max-w-sm mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search profiles, posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 bg-muted/80 border-0 rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:bg-background transition-all duration-200"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">⌘</kbd>
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">K</kbd>
                </div>
              </div>
            </form>
          </div>

          {/* Center Section - Navigation Items */}
          <div className="flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex flex-col items-center px-4 py-3 rounded-lg transition-all duration-200 group relative min-w-[70px] ${
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <div className="relative mb-1">
                    <item.icon className="w-5 h-5" />
                    {item.hasNotification && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-center">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Section - Profile and Business */}
          <div className="flex items-center space-x-6">
            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex items-center">
                  <span className="text-sm font-medium">{profile?.full_name || profile?.username || 'User'}</span>
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-base">
                          {profile?.full_name || profile?.username || 'User'}
                        </p>
                        <p className="text-sm text-muted-foreground leading-tight">
                          {profile?.job_title || profile?.bio || 'TechPro Member'}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/profile/${profile?.username || 'me'}`}
                      className="inline-flex items-center mt-3 px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      View Profile
                    </Link>
                  </div>
                  <div className="py-2">
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings & Privacy
                    </Link>
                    <Link
                      to="/help"
                      className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      Help & Support
                    </Link>
                  </div>
                  <div className="border-t border-border pt-2">
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
                </div>
              )}
            </div>

            {/* Business/Tools Dropdown */}
            <div className="border-l border-border pl-4" ref={businessDropdownRef}>
              <div className="relative">
                <button 
                  onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
                  className="flex items-center px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                >
                  <Grid3X3 className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium hidden lg:block">Tools</span>
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${showBusinessDropdown ? 'rotate-180' : ''}`} />
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

    </nav>
  );
};

export default Navbar;
