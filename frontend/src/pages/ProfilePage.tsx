import { ArrowLeft, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { getStoredUser, logout } from "../api/auth";
import { BottomNav } from "../components/BottomNav";
import { EmptyState } from "../components/EmptyState";
import { Toast } from "../components/Toast";

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

export function ProfilePage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [toast, setToast] = useState<ToastState | null>(null);

  function handleLogout() {
    const confirmed = window.confirm("Выйти из аккаунта?");

    if (!confirmed) return;

    logout();
    setToast({
      message: "Котик выпустил тебя из аккаунта",
      type: "success",
    });

    navigate("/login", { replace: true });
  }

  if (!user) {
    return (
      <main className="mobile-page profile-page">
        <EmptyState
          title="Пользователь не найден"
          text="Котик не нашел сохраненную сессию. Лучше войти заново."
          actionText="Перейти ко входу"
          onAction={() => navigate("/login")}
        />
      </main>
    );
  }

  return (
    <main className="mobile-page profile-page">
      <header className="details-nav">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>

        <h1>Профиль</h1>
      </header>

      <section className="profile-hero">
        <div className="profile-avatar">
          <UserRound size={42} />
        </div>

        <div className="profile-cat">ᓚᘏᗢ</div>

        <h2>{user.name}</h2>

        <p>{getRoleLabel(user.role)}</p>
      </section>

      <section className="profile-card">
        <div className="profile-row">
          <span>ID пользователя</span>
          <b>{user.id}</b>
        </div>

        <div className="profile-row">
          <span>Роль</span>
          <b>{getRoleLabel(user.role)}</b>
        </div>

        <div className="profile-row">
          <span>Доступ</span>
          <b>
            {user.role === "master"
              ? "Только свои записи"
              : "Все записи"}
          </b>
        </div>

        <div className="profile-row">
          <span>Master ID</span>
          <b>{user.masterId ?? "—"}</b>
        </div>
      </section>

      <section className="profile-permissions">
        <h2>Права аккаунта</h2>

        {user.role === "admin" || user.role === "owner" ? (
          <>
            <div className="permission-item">
              <ShieldCheck size={20} />
              <span>Может создавать записи</span>
            </div>

            <div className="permission-item">
              <ShieldCheck size={20} />
              <span>Может переносить записи</span>
            </div>

            <div className="permission-item">
              <ShieldCheck size={20} />
              <span>Может отменять записи</span>
            </div>

            <div className="permission-item">
              <ShieldCheck size={20} />
              <span>Видит всех мастеров</span>
            </div>
          </>
        ) : (
          <>
            <div className="permission-item">
              <ShieldCheck size={20} />
              <span>Видит только свои записи</span>
            </div>

            <div className="permission-item">
              <ShieldCheck size={20} />
              <span>Может менять статус своих записей</span>
            </div>
          </>
        )}
      </section>

      <button className="logout-button" onClick={handleLogout}>
        <LogOut size={22} />
        Выйти из аккаунта
      </button>

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