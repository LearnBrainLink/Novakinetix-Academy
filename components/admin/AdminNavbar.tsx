import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const navLinks = [
  { name: "Dashboard", href: "/admin" },
  { name: "Users", href: "/admin/users" },
  { name: "Videos", href: "/admin/videos" },
  { name: "Internships", href: "/admin/internships" },
  { name: "Analytics", href: "/admin/analytics" },
];

export default function AdminNavbar() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white border-b border-blue-100 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="h-8 w-8" />
          <span className="font-bold text-blue-700 text-lg">Admin Panel</span>
          <div className="hidden md:flex gap-2 ml-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-blue-700 hover:text-blue-900 px-3 py-1 rounded transition-colors font-medium text-sm"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2 text-blue-700 border-blue-200 hover:bg-blue-50"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>
    </nav>
  );
} 