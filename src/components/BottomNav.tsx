import { NavLink } from "react-router-dom";
import { Compass, List, Map as MapIcon, Settings as SettingsIcon } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: Compass, end: true },
  { to: "/map", label: "Map", icon: MapIcon, end: false },
  { to: "/spots", label: "Spots", icon: List, end: false },
  { to: "/settings", label: "Settings", icon: SettingsIcon, end: false },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 bg-ink-panel/95 backdrop-blur border-t border-ink-line pb-[env(safe-area-inset-bottom)] z-10">
      <ul className="max-w-2xl mx-auto grid grid-cols-4">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-3 gap-1 text-xs ${
                  isActive ? "text-ink-text" : "text-ink-muted"
                }`
              }
            >
              <Icon size={22} />
              <span className="font-medium">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
