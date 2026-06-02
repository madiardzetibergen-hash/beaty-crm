import {
  ChevronRight,
  ClipboardList,
  LogOut,
  MessageSquarePlus,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getStoredUser, logout } from "../api/auth";
import { BottomNav } from "../components/BottomNav";
import { Toast } from "../components/Toast";
import { useState } from "react";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
};

function getRoleLabel(role?: string) {
  if (role === "owner") return "Владелец";
  if (role === "admin") return "Админ";
  if (role === "master") return "Мастер";
  return "Пользователь";
}

export function MorePage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [toast, setToast] = useState<ToastState | null>(null);

  function handleLogout() {
    const confirmed = window.confirm("Выйти из аккаунта?");

    if (!confirmed) return;

    logout();
    setToast({
      message: "Котик закрыл сессию",
      type: "success",
    });

    navigate("/login", { replace: true });
  }

  return (
    <main className="mobile-page more-page">
      <header className="page-header">
        <div>
          <h1>Еще</h1>
          <p>Профиль, заявки и настройки</p>
        </div>
      </header>

      <section className="more-profile-card">
        <div className="more-avatar">
          <UserRound size={30} />
        </div>

        <div>
          <h2>{user?.name ?? "Пользователь"}</h2>
          <p>{getRoleLabel(user?.role)}</p>
        </div>

        <div className="more-profile-cat">ᓚᘏᗢ</div>
      </section>

      <section className="more-list">
        <button onClick={() => navigate("/profile")}>
          <div className="more-item-icon">
            <UserRound size={22} />
          </div>

          <div>
            <b>Профиль</b>
            <span>Аккаунт и права доступа</span>
          </div>

          <ChevronRight size={22} />
        </button>

        <button onClick={() => navigate("/requests")}>
          <div className="more-item-icon">
            <ClipboardList size={22} />
          </div>

          <div>
            <b>Заявки админу</b>
            <span>Просьбы мастеров и задачи</span>
          </div>

          <ChevronRight size={22} />
        </button>

        {user?.role === "master" && (
          <button onClick={() => navigate("/requests/new")}>
            <div className="more-item-icon">
              <MessageSquarePlus size={22} />
            </div>

            <div>
              <b>Написать админу</b>
              <span>Попросить перенос, отмену или правку</span>
            </div>

            <ChevronRight size={22} />
          </button>
        )}

        <button className="logout-list-button" onClick={handleLogout}>
          <div className="more-item-icon dark">
            <LogOut size={22} />
          </div>

          <div>
            <b>Выйти</b>
            <span>Завершить сессию</span>
          </div>

          <ChevronRight size={22} />
        </button>
      </section>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <BottomNav />
    </main>
  );
}