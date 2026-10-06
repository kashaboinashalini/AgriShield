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

async function getWeather({ lat, lon, location } = {}) {
  const key = process.env.WEATHER_API_KEY;
  const unavailable = (message) => ({
    unavailable: true,
    source: 'OpenWeather',
    dataType: 'unavailable',
    message: message || 'Live weather data is temporarily unavailable. Please try again.',
    location: location || 'Your farm',
    lastUpdated: new Date().toISOString(),
  });

  if (!key) return unavailable('Live weather data is temporarily unavailable. No weather API key configured on the server.');

  try {
    if (lat != null && lon != null) return await fetchLiveWeather(Number(lat), Number(lon), location);
  } catch {
    return unavailable();
  }

  if (location) {
    try {
      const geo = await axios.get('https://api.openweathermap.org/geo/1.0/direct', { params: { q: location, limit: 1, appid: key }, timeout: 9000 });
      if (geo.data && geo.data[0]) return await fetchLiveWeather(geo.data[0].lat, geo.data[0].lon, location);
      return unavailable(`Location "${location}" was not found in the weather service.`);
    } catch {
      return unavailable();
    }
  }
  return unavailable('Live weather data is temporarily unavailable. Add a farm with coordinates or location first.');
}

module.exports = { getWeather, buildRecommendations };
