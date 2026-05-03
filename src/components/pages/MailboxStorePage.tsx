import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  fetchProviders, trackClick, fetchMyOrders,
  MailboxProvider, MailboxOrder, MailboxPlan,
} from "@/api/mailbox";
import { useAuth } from "@/contexts/AuthContext";
import { MailboxHero, MailboxFaq } from "./mailbox/MailboxHero";
import MyOrdersList from "./mailbox/MyOrdersList";
import ProviderCard from "./mailbox/ProviderCard";
import RequestModal from "./mailbox/RequestModal";

export default function MailboxStorePage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<MailboxProvider[]>([]);
  const [orders, setOrders] = useState<MailboxOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestModal, setRequestModal] = useState<{
    provider: MailboxProvider; plan: MailboxPlan;
  } | null>(null);

  useEffect(() => {
    Promise.all([fetchProviders(), user ? fetchMyOrders() : Promise.resolve({ orders: [] })])
      .then(([p, o]) => {
        setProviders(p.providers || []);
        setOrders(o.orders || []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const onClickPlan = async (p: MailboxProvider, plan: MailboxPlan) => {
    await trackClick(p.provider, plan.code, plan.url);
    window.open(plan.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <MailboxHero />

      {user && orders.length > 0 && <MyOrdersList orders={orders} />}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Icon name="Loader2" size={18} className="animate-spin" />
          Загружаем тарифы...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {providers.map((p) => (
            <ProviderCard
              key={p.provider}
              provider={p}
              onClickPlan={onClickPlan}
              onRequest={(plan) => setRequestModal({ provider: p, plan })}
            />
          ))}
        </div>
      )}

      <MailboxFaq />

      {requestModal && (
        <RequestModal
          provider={requestModal.provider}
          plan={requestModal.plan}
          defaultEmail={user?.email || ""}
          defaultName={user?.name || ""}
          onClose={() => setRequestModal(null)}
          onSuccess={() => {
            setRequestModal(null);
            if (user) fetchMyOrders().then((o) => setOrders(o.orders || []));
          }}
        />
      )}
    </div>
  );
}
