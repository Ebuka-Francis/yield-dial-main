import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, Wallet, Menu, X } from "lucide-react";
import { useState } from "react";
import { UserMenu } from "@/components/UserMenu";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";

const navItems = [
  { path: "/", label: "Markets", icon: BarChart3 },
  { path: "/portfolio", label: "Portfolio", icon: Wallet },
];

export const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-black tracking-tight text-foreground">
            Destaker
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
                {active && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 rounded-md bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex">
            <UserMenu />
          </div>
          <button
            className="md:hidden text-muted-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border/50 bg-background px-4 py-3 md:hidden"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                location.pathname === item.path
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <div className="mt-2">
            <UserMenu />
          </div>
        </motion.div>
      )}

      <ConnectWalletModal />
    </nav>
  );
};
