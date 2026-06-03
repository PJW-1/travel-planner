export type TripWeather = {
  date: string;
  basisLabel: string;
  locationName: string;
  temperatureText: string;
  condition: string;
  precipitationText: string;
  windText: string;
  advice: string;
};

type WeatherRequest = {
  lat: number;
  lng: number;
  date: string;
  locationName: string;
};

type OpenMeteoResponse = {
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
    precipitation_probability?: number[];
    precipitation?: number[];
    wind_speed_10m?: number[];
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
};

function getWeatherCondition(code?: number) {
  if (code === 0) return "맑음";
  if (code === 1 || code === 2) return "대체로 맑음";
  if (code === 3) return "흐림";
  if (code === 45 || code === 48) return "안개";
  if ([51, 53, 55, 56, 57].includes(Number(code))) return "이슬비";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(Number(code))) return "비";
  if ([71, 73, 75, 77, 85, 86].includes(Number(code))) return "눈";
  if ([95, 96, 99].includes(Number(code))) return "천둥번개";
  return "예보 확인 중";
}

function buildWeatherAdvice(code?: number, precipitationProbability = 0, windSpeed = 0) {
  if ([95, 96, 99].includes(Number(code))) {
    return "번개 가능성이 있어 실내 동선이나 대체 장소를 같이 준비해두는 편이 좋아요.";
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(Number(code)) || precipitationProbability >= 50) {
    return "비 가능성이 있어 우산과 미끄럽지 않은 신발을 챙기면 좋아요.";
  }

  if ([71, 73, 75, 77, 85, 86].includes(Number(code))) {
    return "눈 예보가 있어 이동 시간을 여유 있게 잡는 편이 안전해요.";
  }

  if (windSpeed >= 10) {
    return "바람이 강한 편이라 강가나 전망대 일정은 체감온도를 고려해보세요.";
  }

  return "큰 날씨 변수는 적은 편이라 현재 동선대로 움직이기 좋아요.";
}

function formatTemperature(current?: number, min?: number, max?: number) {
  if (typeof current === "number") {
    return `${Math.round(current)}°C`;
  }

  if (typeof min === "number" && typeof max === "number") {
    return `${Math.round(min)}° / ${Math.round(max)}°C`;
  }

  return "-";
}

function getDaytimeIndexes(times: string[] = [], date: string) {
  const indexes = times
    .map((time, index) => ({ time, index }))
    .filter(({ time }) => {
      if (!time.startsWith(`${date}T`)) {
        return false;
      }

      const hour = Number(time.slice(11, 13));
      return hour >= 9 && hour <= 21;
    })
    .map(({ index }) => index);

  if (indexes.length > 0) {
    return indexes;
  }

  return times
    .map((time, index) => ({ time, index }))
    .filter(({ time }) => time.startsWith(`${date}T`))
    .map(({ index }) => index);
}

function average(values: Array<number | undefined>) {
  const validValues = values.filter((value): value is number => typeof value === "number");

  if (validValues.length === 0) {
    return undefined;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function pickRepresentativeWeatherCode(codes: Array<number | undefined>) {
  const validCodes = codes.filter((code): code is number => typeof code === "number");

  if (validCodes.length === 0) {
    return undefined;
  }

  const rainyCode = validCodes.find((code) =>
    [61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code),
  );

  if (rainyCode) {
    return rainyCode;
  }

  const counts = new Map<number, number>();
  validCodes.forEach((code) => {
    counts.set(code, (counts.get(code) ?? 0) + 1);
  });

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
}

export async function fetchTripWeather({
  lat,
  lng,
  date,
  locationName,
}: WeatherRequest): Promise<TripWeather> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: "auto",
    hourly: "temperature_2m,weather_code,precipitation_probability,precipitation,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    start_date: date,
    end_date: date,
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

  if (!response.ok) {
    throw new Error("날씨 정보를 불러오지 못했습니다.");
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const daytimeIndexes = getDaytimeIndexes(data.hourly?.time, date);
  const dayIndex = Math.max(0, data.daily?.time?.findIndex((item) => item === date) ?? 0);
  const representativeCode = pickRepresentativeWeatherCode(
    daytimeIndexes.map((index) => data.hourly?.weather_code?.[index]),
  );
  const dailyCode = data.daily?.weather_code?.[dayIndex];
  const weatherCode = typeof representativeCode === "number" ? representativeCode : dailyCode;
  const precipitationProbability =
    average(daytimeIndexes.map((index) => data.hourly?.precipitation_probability?.[index])) ??
    data.daily?.precipitation_probability_max?.[dayIndex] ??
    0;
  const precipitation =
    average(daytimeIndexes.map((index) => data.hourly?.precipitation?.[index])) ?? 0;
  const windSpeed =
    average(daytimeIndexes.map((index) => data.hourly?.wind_speed_10m?.[index])) ?? 0;
  const temperature =
    average(daytimeIndexes.map((index) => data.hourly?.temperature_2m?.[index]));

  return {
    date,
    basisLabel: "당일 낮 시간대 평균 기준",
    locationName,
    temperatureText: formatTemperature(
      temperature,
      data.daily?.temperature_2m_min?.[dayIndex],
      data.daily?.temperature_2m_max?.[dayIndex],
    ),
    condition: getWeatherCondition(weatherCode),
    precipitationText:
      precipitationProbability > 0
        ? `강수확률 ${Math.round(precipitationProbability)}%`
        : precipitation > 0
          ? `강수량 ${precipitation.toFixed(1)}mm`
          : "강수 가능성 낮음",
    windText: windSpeed > 0 ? `풍속 ${Math.round(windSpeed)}km/h` : "바람 정보 없음",
    advice: buildWeatherAdvice(weatherCode, precipitationProbability, windSpeed),
  };
}
