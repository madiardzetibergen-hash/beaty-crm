import {
  CalendarDays,
  Home,
  MoreHorizontal,
  UserRound,
  UsersRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/today", label: "Сегодня", icon: Home },
  { to: "/calendar", label: "Календарь", icon: CalendarDays },
  { to: "/clients", label: "Клиенты", icon: UsersRound },
  { to: "/masters", label: "Мастера", icon: UserRound },
  { to: "/more", label: "Еще", icon: MoreHorizontal },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "bottom-nav-item active" : "bottom-nav-item"
            }
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}