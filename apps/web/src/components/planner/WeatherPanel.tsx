import { CloudSun, MapPin, Umbrella, Wind } from "lucide-react";
import type { TripWeather } from "@/lib/weatherApi";

type WeatherPanelProps = {
  weather: TripWeather | null;
  loading: boolean;
  error?: string;
  locationName?: string;
};

function formatWeatherDate(dateValue?: string) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function WeatherPanel({ weather, loading, error, locationName }: WeatherPanelProps) {
  return (
    <section className="weather-panel">
      <div className="weather-panel__header">
        <div className="weather-panel__icon">
          <CloudSun size={24} />
        </div>
        <div>
          <p className="eyebrow">당일 여행 체크</p>
          <h2>오늘 이 근처 날씨</h2>
        </div>
      </div>

      {loading ? (
        <article className="weather-card">
          <p>일정 주변 날씨를 확인하는 중입니다.</p>
        </article>
      ) : null}

      {!loading && error ? (
        <article className="weather-card">
          <strong>날씨를 불러오지 못했습니다.</strong>
          <p>{error}</p>
        </article>
      ) : null}

      {!loading && !error && !weather ? (
        <article className="weather-card">
          <strong>날씨를 볼 장소가 없습니다.</strong>
          <p>{locationName ? `${locationName} 주변 좌표가 필요합니다.` : "장소를 추가하면 당일 예보가 표시됩니다."}</p>
        </article>
      ) : null}

      {!loading && !error && weather ? (
        <div className="weather-panel__body">
          <div className="weather-panel__place-line">
            <MapPin size={15} />
            <span>{weather.locationName} 주변</span>
            <b>{formatWeatherDate(weather.date)}</b>
          </div>

          <div className="weather-panel__forecast">
            <strong>{weather.temperatureText}</strong>
            <span>{weather.condition}</span>
          </div>

          <p className="weather-panel__time">{weather.basisLabel}</p>

          <div className="weather-panel__chips">
            <span>
              <Umbrella size={15} />
              {weather.precipitationText}
            </span>
            <span>
              <Wind size={15} />
              {weather.windText}
            </span>
          </div>

          <p className="weather-panel__advice">{weather.advice}</p>
        </div>
      ) : null}
    </section>
  );
}
