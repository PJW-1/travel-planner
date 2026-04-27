import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { RouteMarketCard } from "@/components/cards/RouteMarketCard";
import { fetchCommunityRoutes, type CommunityRouteSummary } from "@/lib/contentApi";

export function CommunityPage() {
  const [routes, setRoutes] = useState<CommunityRouteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadRoutes() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchCommunityRoutes();

        if (!isMounted) {
          return;
        }

        setRoutes(data.routes);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "커뮤니티 피드를 불러오는 중 오류가 발생했습니다.",
        );
        setRoutes([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadRoutes();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="single-column-page">
      {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}

      {loading ? (
        <section className="community-feed-empty">
          <LoaderCircle size={18} className="spin" />
          <p>커뮤니티 피드를 불러오는 중입니다.</p>
        </section>
      ) : routes.length > 0 ? (
        <section className="community-post-feed">
          {routes.map((route) => (
            <RouteMarketCard key={route.id} route={route} />
          ))}
        </section>
      ) : (
        <section className="community-feed-empty">
          <p>아직 공개된 루트가 없습니다.</p>
        </section>
      )}
    </div>
  );
}
