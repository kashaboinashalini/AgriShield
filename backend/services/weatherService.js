const axios = require('axios');

// Weather service — REAL data only.
// If WEATHER_API_KEY is not configured or the provider fails, the service reports
// `unavailable: true`. It NEVER fabricates weather values.

function buildRecommendations({ rainProbability, temperature, windSpeed, humidity, condition }) {
  const recs = [];
  if (rainProbability > 60 || /rain|thunderstorm|shower/i.test(condition || '')) {
    recs.push('Heavy rainfall expected — avoid irrigation today.');
    recs.push('Check field drainage channels before the rain.');
    recs.push('Delay fertilizer and pesticide application.');
    recs.push('Protect harvested crops from water damage.');
  }
  if (temperature > 34) {
    recs.push('High temperature expected — increase monitoring for crop water stress.');
    recs.push('Irrigate early morning or late evening to reduce evaporation.');
    recs.push('Consider shade nets for heat-sensitive vegetables.');
  }
  if (temperature < 10) {
    recs.push('Low temperature — protect sensitive crops from cold stress.');
    recs.push('Avoid irrigation in early morning hours.');
  }
  if (windSpeed > 28) {
    recs.push('Strong wind expected — avoid spraying pesticides today.');
    recs.push('Stake tall crops and check farm infrastructure.');
  }
  if (humidity > 80) {
    recs.push('High humidity detected — disease risk may increase. Scout crops daily.');
  }
  if (!recs.length) {
    recs.push('Weather conditions are favourable for regular farm operations.');
    recs.push('Continue routine scouting and irrigation schedule.');
  }
  return recs;
}

async function fetchLiveWeather(lat, lon, locationLabel) {
  const key = process.env.WEATHER_API_KEY;
  const base = process.env.WEATHER_API_BASE || 'https://api.openweathermap.org/data/2.5';
  const [cur, fc] = await Promise.all([
    axios.get(`${base}/weather`, { params: { lat, lon, appid: key, units: 'metric' }, timeout: 9000 }),
    axios.get(`${base}/forecast`, { params: { lat, lon, appid: key, units: 'metric', cnt: 40 }, timeout: 9000 }).catch(() => null),
  ]);
  const d = cur.data;
  if (!d || !d.weather || !d.weather[0]) throw new Error('Invalid weather response');

  let forecast = [];
  if (fc && fc.data && fc.data.list && fc.data.list.length) {
    const byDay = {};
    fc.data.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toISOString().slice(0, 10);
      if (!byDay[dayKey]) byDay[dayKey] = { date: dayKey, day: date.toLocaleDateString('en-IN', { weekday: 'short' }), tempMax: -99, tempMin: 99, rainProbability: 0, condition: item.weather[0].description };
      byDay[dayKey].tempMax = Math.max(byDay[dayKey].tempMax, Math.round(item.main.temp_max));
      byDay[dayKey].tempMin = Math.min(byDay[dayKey].tempMin, Math.round(item.main.temp_min));
      byDay[dayKey].rainProbability = Math.max(byDay[dayKey].rainProbability, Math.round((item.pop || 0) * 100));
    });
    forecast = Object.values(byDay).slice(0, 7);
  }

  const rainProbability = fc && fc.data.list && fc.data.list[0] ? Math.round((fc.data.list[0].pop || 0) * 100) : 0;
  const windDeg = d.wind && d.wind.deg;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return {
    location: locationLabel || d.name,
    temperature: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    humidity: d.main.humidity,
    rainProbability,
    rainfall: d.rain && d.rain['1h'] ? Math.round(d.rain['1h'] * 10) / 10 : 0,
    windSpeed: Math.round((d.wind.speed || 0) * 3.6),
    windDirection: windDeg != null ? dirs[Math.round(windDeg / 45) % 8] : null,
    cloudCover: d.clouds ? d.clouds.all : null,
    pressure: d.main.pressure || null,
    uvIndex: null, // not provided by the free OpenWeather current endpoint
    condition: d.weather[0].description,
    icon: d.weather[0].icon,
    sunrise: new Date(d.sys.sunrise * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    sunset: new Date(d.sys.sunset * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    forecast,
    recommendations: buildRecommendations({ rainProbability, temperature: d.main.temp, windSpeed: (d.wind.speed || 0) * 3.6, humidity: d.main.humidity, condition: d.weather[0].description }),
    source: 'OpenWeather',
    dataType: 'live',
    lastUpdated: new Date().toISOString(),
  };
}

const OPEN_METEO_CODES = {
  0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'fog', 48: 'depositing rime fog', 51: 'light drizzle', 53: 'moderate drizzle', 55: 'dense drizzle',
  61: 'slight rain', 63: 'moderate rain', 65: 'heavy rain', 71: 'slight snow', 73: 'moderate snow',
  75: 'heavy snow', 80: 'rain showers', 81: 'heavy rain showers', 95: 'thunderstorm', 96: 'thunderstorm with hail',
};

async function fetchOpenMeteo(lat, lon, locationLabel) {
  // Free, no-key weather provider used when OpenWeather is not configured.
  const url = 'https://api.open-meteo.com/v1/forecast';
  const res = await axios.get(url, {
    params: {
      latitude: lat, longitude: lon, timezone: 'auto',
      current: 'temperature_2m,relative_humidity_2m,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover,apparent_temperature',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,sunrise,sunset',
      forecast_days: 7,
    },
    timeout: 10000,
  });
  const d = res.data;
  const cur = d.current || {};
  const windDeg = cur.wind_direction_10m;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const rainProb0 = (d.daily && d.daily.precipitation_probability_max && d.daily.precipitation_probability_max[0]) || 0;
  const forecast = ((d.daily && d.daily.time) || []).map((day, i) => ({
    date: day,
    day: new Date(day).toLocaleDateString('en-IN', { weekday: 'short' }),
    tempMax: Math.round(d.daily.temperature_2m_max[i]),
    tempMin: Math.round(d.daily.temperature_2m_min[i]),
    rainProbability: d.daily.precipitation_probability_max ? d.daily.precipitation_probability_max[i] : 0,
    condition: OPEN_METEO_CODES[d.daily.weather_code[i]] || `code ${d.daily.weather_code[i]}`,
  })).slice(0, 7);
  return {
    location: locationLabel || `Lat ${lat}, Lon ${lon}`,
    temperature: Math.round(cur.temperature_2m),
    feelsLike: Math.round(cur.apparent_temperature),
    humidity: cur.relative_humidity_2m,
    rainProbability: rainProb0,
    rainfall: (d.hourly && d.hourly.precipitation && d.hourly.precipitation[0]) || 0,
    windSpeed: Math.round((cur.wind_speed_10m || 0)),
    windDirection: windDeg != null ? dirs[Math.round(windDeg / 45) % 8] : null,
    cloudCover: cur.cloud_cover != null ? cur.cloud_cover : null,
    pressure: cur.pressure_msl != null ? Math.round(cur.pressure_msl) : null,
    uvIndex: null,
    condition: OPEN_METEO_CODES[cur.weather_code] || `code ${cur.weather_code}`,
    sunrise: d.daily && d.daily.sunrise ? new Date(d.daily.sunrise[0]).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null,
    sunset: d.daily && d.daily.sunset ? new Date(d.daily.sunset[0]).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null,
    forecast,
    recommendations: buildRecommendations({ rainProbability: rainProb0, temperature: cur.temperature_2m, windSpeed: cur.wind_speed_10m || 0, humidity: cur.relative_humidity_2m, condition: OPEN_METEO_CODES[cur.weather_code] || '' }),
    source: 'Open-Meteo',
    dataType: 'live',
    lastUpdated: new Date().toISOString(),
  };
}

async function getWeather({ lat, lon, location } = {}) {
  const key = process.env.WEATHER_API_KEY;
  const unavailable = (message) => ({
    unavailable: true,
    source: key ? 'OpenWeather' : 'Open-Meteo',
    dataType: 'unavailable',
    message: message || 'Live weather data is temporarily unavailable. Please try again.',
    location: location || 'Your farm',
    lastUpdated: new Date().toISOString(),
  });

  // 1) OpenWeather preferred when a key is configured
  if (key && lat != null && lon != null) {
    try { return await fetchLiveWeather(Number(lat), Number(lon), location); } catch { /* fall through to Open-Meteo */ }
  }
  if (key && location) {
    try {
      const geo = await axios.get('https://api.openweathermap.org/geo/1.0/direct', { params: { q: location, limit: 1, appid: key }, timeout: 9000 });
      if (geo.data && geo.data[0]) return await fetchLiveWeather(geo.data[0].lat, geo.data[0].lon, location);
    } catch { /* fall through to Open-Meteo */ }
  }

  // 2) Free fallback — no API key needed
  try {
    if (lat != null && lon != null) return await fetchOpenMeteo(Number(lat), Number(lon), location);
    if (location) {
      const geo = await axios.get('https://geocoding-api.open-meteo.com/v1/search', { params: { name: location, count: 1 }, timeout: 9000 });
      const g = geo.data && geo.data.results && geo.data.results[0];
      if (g) return await fetchOpenMeteo(g.latitude, g.longitude, location);
      return unavailable(`Location "${location}" was not found in the weather service.`);
    }
  } catch {
    return unavailable();
  }
  return unavailable('Live weather data is temporarily unavailable. Add a farm with coordinates or location first.');
}

module.exports = { getWeather, buildRecommendations };
