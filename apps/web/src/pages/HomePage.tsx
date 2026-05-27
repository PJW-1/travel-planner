import { useEffect, useState } from "react";
import { ChevronRight, Heart, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchHomeContent, type PopularDestination } from "@/lib/contentApi";

const fallbackDestinations: PopularDestination[] = [
  {
    id: "fallback-1",
    title: "성수동 힙플레이스 완벽 정복",
    description: "커뮤니티에서 좋아요를 많이 받은 여행 루트가 여기에 표시됩니다.",
    destination: "서울",
    author: "TripFlow",
    likes: 0,
    theme: "urban",
    imageUrl:
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=900",
  },
];

const heroBackgroundImage =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2000";

export function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [popularDestinations, setPopularDestinations] =
    useState<PopularDestination[]>(fallbackDestinations);

  useEffect(() => {
    let isMounted = true;

    async function loadHome() {
      try {
        const data = await fetchHomeContent();

        if (isMounted && data.popularDestinations.length > 0) {
          setPopularDestinations(data.popularDestinations);
          setCurrentSlide(0);
        }
      } catch {
        if (isMounted) {
          setPopularDestinations(fallbackDestinations);
        }
      }
    }

    void loadHome();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((previous) => (previous + 1) % popularDestinations.length);
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [popularDestinations.length]);

  return (
    <div className="home-minimal">
      <section
        className="home-minimal__hero"
        style={{ backgroundImage: `url(${heroBackgroundImage})` }}
      >
        <div className="home-minimal__overlay" />

        <div className="home-minimal__content">
          <div className="home-minimal__copy">
            <p className="home-minimal__eyebrow">계획부터 기록까지, 여행을 더 쉽게</p>
            <h1>
              나만의 여행을
              <br />
              TripFlow로
            </h1>

            <Link to="/setup" className="home-minimal__cta">
              일정 만들러 가기
              <ChevronRight size={18} />
            </Link>
          </div>

          <div className="home-minimal__showcase">
            <div className="home-minimal__glow" />

            <div className="home-minimal__card">
              <div className="home-minimal__badge">
                <span className="home-minimal__pulse" />
                실시간 인기 여행지
              </div>

              {popularDestinations.map((destination, index) => (
                <Link
                  key={destination.id}
                  to={`/community/${destination.id}`}
                  className={
                    index === currentSlide
                      ? "home-minimal__slide is-active"
                      : "home-minimal__slide"
                  }
                >
                  <img src={destination.imageUrl} alt={destination.destination} />

                  <div className="home-minimal__info">
                    <div className="home-minimal__meta">
                      <span>
                        <MapPin size={14} />
                        {destination.destination}
                      </span>
                      <strong>
                        <Heart size={14} />
                        {destination.likes.toLocaleString("ko-KR")}
                      </strong>
                    </div>

                    <h2>{destination.destination}</h2>
                    <p>{destination.title}</p>
                  </div>
                </Link>
              ))}

              <div className="home-minimal__pagination">
                {popularDestinations.map((destination, index) => (
                  <button
                    key={destination.id}
                    type="button"
                    className={
                      index === currentSlide
                        ? "home-minimal__dot is-active"
                        : "home-minimal__dot"
                    }
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`${destination.destination} 보기`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
