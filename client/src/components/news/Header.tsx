import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Globe, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Globe className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight hidden sm:block">
              NewsTracker
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant={location === "/" ? "secondary" : "ghost"} size="sm">
                Briefings
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button variant={location === "/onboarding" ? "secondary" : "ghost"} size="sm">
                Customize
              </Button>
            </Link>
          </nav>

          {/* Search + Actions */}
          <div className="flex items-center gap-2">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics, regions..."
                  className="w-48 sm:w-64 h-9 text-sm"
                />
                <Button type="submit" size="sm" variant="ghost">
                  <Search className="w-4 h-4" />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setSearchOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setSearchOpen(true)}>
                <Search className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline text-sm">Search</span>
              </Button>
            )}

            {/* Mobile menu */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                Briefings
              </Button>
            </Link>
            <Link href="/onboarding" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                Customize
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
