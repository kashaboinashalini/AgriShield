function disasterAlerts(weather) {
  const alerts = [];
  if (!weather) return alerts;
  if (weather.rainProbability > 80) alerts.push({ type: 'FLOOD RISK ALERT', severity: 'HIGH', message: 'Heavy rainfall expected in your area.', actions: ['Check drainage channels', 'Move harvested crops to safe storage', 'Avoid unnecessary irrigation', 'Keep livestock in sheltered areas'] });
  else if (weather.rainProbability > 60) alerts.push({ type: 'HEAVY RAINFALL ALERT', severity: 'MEDIUM', message: 'Significant rain likely within 24 hours.', actions: ['Delay fertilizer application', 'Ensure field drainage', 'Cover stored grain'] });
  if (weather.temperature > 40) alerts.push({ type: 'EXTREME HEAT ALERT', severity: 'HIGH', message: `Temperature may reach ${weather.temperature}°C.`, actions: ['Irrigate early morning/evening', 'Provide shade for animals', 'Avoid midday field work'] });
  if (weather.humidity < 25 && weather.temperature > 34) alerts.push({ type: 'DROUGHT RISK ALERT', severity: 'MEDIUM', message: 'Hot and dry conditions persist.', actions: ['Mulch fields to conserve moisture', 'Prioritize critical irrigation', 'Consider drought-tolerant varieties next season'] });
  if (weather.windSpeed > 40) alerts.push({ type: 'STRONG WIND ALERT', severity: 'HIGH', message: `Winds up to ${weather.windSpeed} km/h expected.`, actions: ['Stake tall crops', 'Delay spraying operations', 'Secure greenhouse coverings'] });
  return alerts;
}
module.exports = { disasterAlerts };
