import { useEffect, useState } from "react";
import { ChevronRight, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";

const popularDestinations = [
  {
    id: 1,
    city: "파리",
    country: "프랑스",
    title: "에펠탑이 보이는 로맨틱한 거리",
    rating: "4.9",
    imageUrl:
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: 2,
    city: "도쿄",
    country: "일본",
    title: "전통과 현대가 공존하는 도심",
    rating: "4.8",
    imageUrl:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: 3,
    city: "발리",
    country: "인도네시아",
    title: "여유로운 휴양지에서의 하루",
    rating: "4.9",
    imageUrl:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: 4,
    city: "뉴욕",
    country: "미국",
    title: "잠들지 않는 화려한 도시",
    rating: "4.7",
    imageUrl:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=900",
  },
];

const heroBackgroundImage =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2000";

export function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((previous) => (previous + 1) % popularDestinations.length);
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="home-minimal">
      <section
        className="home-minimal__hero"
        style={{ backgroundImage: `url(${heroBackgroundImage})` }}
      >
        <div className="home-minimal__overlay" />

        <div className="home-minimal__content">
          <div className="home-minimal__copy">
            <p className="home-minimal__eyebrow">계획부터 예약까지, 물 흐르듯 쉬운</p>
            <h1>
              나만의 완벽한 여행 앱
              <br />
              트립플로우
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
                <div
                  key={destination.id}
                  className={
                    index === currentSlide
                      ? "home-minimal__slide is-active"
                      : "home-minimal__slide"
                  }
                >
                  <img src={destination.imageUrl} alt={destination.city} />

                  <div className="home-minimal__info">
                    <div className="home-minimal__meta">
                      <span>
                        <MapPin size={14} />
                        {destination.country}
                      </span>
                      <strong>
                        <Star size={14} />
                        {destination.rating}
                      </strong>
                    </div>

                    <h2>{destination.city}</h2>
                    <p>{destination.title}</p>
                  </div>
                </div>
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
                    aria-label={`${destination.city} 보기`}
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
