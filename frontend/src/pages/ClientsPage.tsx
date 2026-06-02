import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getClients } from "../api/clients";
import { BottomNav } from "../components/BottomNav";
import { CuteLoader } from "../components/CuteLoader";
import { EmptyState } from "../components/EmptyState";
import { ListSkeleton } from "../components/Skeleton";
import { Toast } from "../components/Toast";

import type { Client } from "../types";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
};

export function ClientsPage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [firstLoading, setFirstLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  function showToast(message: string, type: ToastState["type"] = "info") {
    setToast({ message, type });
  }

  async function loadClients(value = "") {
    try {
      setLoading(true);
      const data = await getClients(value);
      setClients(data);
    } catch {
      showToast("Котик не смог загрузить клиентов", "error");
    } finally {
      setLoading(false);
      setFirstLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadClients(search);
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <main className="mobile-page clients-page">
      <header className="page-header">
        <div>
          <h1>Клиенты</h1>
          <p>Поиск по имени, номеру или последним 4 цифрам</p>
        </div>
      </header>

      <div className="search-box">
        <Search size={20} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Кристина, 0606, 8700..."
        />
      </div>

      <section className="clients-list">
        {firstLoading && (
          <>
            <CuteLoader text="Котик собирает клиентов..." />
            <ListSkeleton count={5} />
          </>
        )}

        {!firstLoading && loading && (
          <CuteLoader text="Котик ищет совпадения..." />
        )}

        {!firstLoading &&
          !loading &&
          clients.map((client) => (
            <button
              key={client.id}
              className="client-card"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <div>
                <b>{client.name}</b>
                <span>
                  {client.phoneLast4 ? `****${client.phoneLast4}` : "номер не указан"}
                </span>
              </div>

              <small>{client.instagram || "История клиента"}</small>
            </button>
          ))}

        {!firstLoading && !loading && clients.length === 0 && (
          <EmptyState
            title={search ? "Ничего не найдено" : "Клиентов нет"}
            text={
              search
                ? "Котик поискал по базе, но такого клиента пока не нашел."
                : "Клиенты появятся после создания записей."
            }
          />
        )}
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