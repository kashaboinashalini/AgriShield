import React, { createContext, useContext, useState } from 'react';

// Bilingual UI strings (English / తెలుగు)
const dict: Record<string, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard', myFarms: 'My Farms', cropHealth: 'Crop Health', diseaseDetection: 'Disease Detection',
    pestDetection: 'Pest Detection', soilHealth: 'Soil Health', cropRecommendation: 'Crop Recommendation',
    irrigation: 'Irrigation', weather: 'Weather', riskAlerts: 'Risk & Alerts', disasterAlerts: 'Disaster Alerts',
    marketPrices: 'Market Prices', profitCalculator: 'Profit Calculator', farmCalendar: 'Farm Calendar',
    aiAssistant: 'AI Assistant', governmentSchemes: 'Government Schemes', satelliteAnalysis: 'Satellite Analysis',
    farmMap: 'Farm Map', analytics: 'Analytics', notifications: 'Notifications', profile: 'Profile',
    settings: 'Settings', logout: 'Logout', searchPlaceholder: 'Search farms, crops, tasks, schemes, scans…',
    loading: 'Loading…', noData: 'No data available', refresh: 'Refresh', lastUpdated: 'Last updated',
    source: 'Source', save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete', add: 'Add',
    complete: 'Complete', activeFarm: 'Active Farm', language: 'Language', units: 'Units', theme: 'Theme',
    account: 'Account', location: 'Location', light: 'Light', dark: 'Dark', acres: 'Acres', hectares: 'Hectares',
    kgPerAcre: 'kg/acre', litres: 'Litres', welcome: 'Welcome', overview: 'Overview', recentActivity: 'Recent Activities',
    upcomingTasks: 'Upcoming Tasks', viewAll: 'View All', noNotifications: 'No notifications',
    markAllRead: 'Mark all read', unread: 'unread', risk: 'Risk', confidence: 'Confidence', severity: 'Severity',
    recommendations: 'Recommendations', prevention: 'Prevention', detected: 'Detected', healthy: 'Healthy',
    actions: 'Recommended Actions', reasons: 'Reasons', forecast: 'Forecast', recommendations_weather: 'Agricultural Recommendations',
    uploadImage: 'Upload Image', capture: 'Capture Photo', analyze: 'Analyze', crop: 'Crop', farm: 'Farm',
    date: 'Date', status: 'Status', priority: 'Priority', description: 'Description', name: 'Name',
    area: 'Area', soilType: 'Soil Type', irrigationType: 'Irrigation Type', village: 'Village', district: 'District',
    state: 'State', phone: 'Phone', email: 'Email', fullName: 'Full Name', password: 'Password',
    currentPassword: 'Current Password', newPassword: 'New Password', changePassword: 'Change Password',
    updateProfile: 'Update Profile', joinDate: 'Joined', role: 'Role', farmer: 'Farmer', expert: 'Agriculture Expert',
    admin: 'Admin', english: 'English', telugu: 'తెలుగు', dataLabels: 'Data Sources', general: 'General',
    today: 'Today', yesterday: 'Yesterday', addFarm: 'Add Farm', addTask: 'Add Task', search: 'Search',
    results: 'results', noResults: 'No results found', tryAgain: 'Please try again', unavailable: 'temporarily unavailable',
    liveData: 'Live data is temporarily unavailable. Please try again.', calculatedData: 'Calculated from your inputs and farm records',
  },
  te: {
    dashboard: 'డాష్‌బోర్డ్', myFarms: 'నా పొలలు', cropHealth: 'పంట ఆరోగ్యం', diseaseDetection: 'రోగ పరిశీలన',
    pestDetection: 'కీటక పరిశీలన', soilHealth: 'మట్టి ఆరోగ్యం', cropRecommendation: 'పంట సూచన',
    irrigation: 'సేద్యం', weather: 'వాతావరణం', riskAlerts: 'ప్రమాదాలు', disasterAlerts: 'దురంత హెచ్చరికలు',
    marketPrices: 'మార్కెట్ ధరలు', profitCalculator: 'లాభ కాలిక్యులేటర్', farmCalendar: 'పొలం క్యాలెండర్',
    aiAssistant: 'AI సహాయకం', governmentSchemes: 'ప్రభుత్వ పథకాలు', satelliteAnalysis: 'ఉపగ్రహ విశ్లేషణ',
    farmMap: 'పొలం మ్యాప్', analytics: 'విశ్లేషణ', notifications: 'హెచ్చరికలు', profile: 'ప్రొఫైల్',
    settings: 'సెట్టింగ్‌లు', logout: 'లాగ్‌అవుట్', searchPlaceholder: 'పొలలు, పంటలు, పనులు, పథకాలు వెతకండి…',
    loading: 'లోడ్ అవుతోంది…', noData: 'డేటా లేదు', refresh: 'రిఫ్రెష్', lastUpdated: 'చివరిసారి నవీకరించబడింది',
    source: 'మూలం', save: 'సేవ్', cancel: 'రద్దు', edit: 'మార్చు', delete: 'తొలగించు', add: 'చేర్చు',
    complete: 'పూర్తయింది', activeFarm: 'క్రియాశీల పొలం', language: 'భాష', units: 'యూనిట్లు', theme: 'థీమ్',
    account: 'ఖాతా', location: 'స్థానం', light: 'లైట్', dark: 'డార్క్', acres: 'ఏకర్లు', hectares: 'హెక్టార్లు',
    kgPerAcre: 'కి.గ్రా./ఏకర్', litres: 'లీటర్లు', welcome: 'స్వాగతం', overview: 'అవలోకనం', recentActivity: 'ఇటీవలి కార్యకలాపాలు',
    upcomingTasks: 'రాబోయే పనులు', viewAll: 'అన్నీ చూడండి', noNotifications: 'హెచ్చరికలు లేవు',
    markAllRead: 'అన్నీ చదివినట్లు గుర్తుంచు', unread: 'చదనివి', risk: 'ప్రమాదం', confidence: 'నమోదు',
    severity: 'తీవ్రత', recommendations: 'సూచనలు', prevention: 'నివారణ', detected: 'కనుగొనబడింది', healthy: 'ఆరోగ్యం',
    actions: 'సూచిత చర్యలు', reasons: 'కారణాలు', forecast: 'అందాజు', recommendations_weather: 'వ్యావసాయ సూచనలు',
    uploadImage: 'చిత్రం అప్‌లోడ్ చేయండి', capture: 'ఫోటో తీయండి', analyze: 'విశ్లేషించు', crop: 'పంట', farm: 'పొలం',
    date: 'తేదీ', status: 'స్థితి', priority: 'ప్రాధాన్యత', description: 'వివరాలు', name: 'పేరు',
    area: 'వైశాల్యం', soilType: 'మట్టి రకం', irrigationType: 'సేద్యం రకం', village: 'గ్రామం', district: 'జిల్లా',
    state: 'రాష్ట్రం', phone: 'ఫోన్', email: 'ఇమెయిల్', fullName: 'పూర్తి పేరు', password: 'పాస్‌వర్డ్',
    currentPassword: 'ప్రస్తుత పాస్‌వర్డ్', newPassword: 'కొత్త పాస్‌వర్డ్', changePassword: 'పాస్‌వర్డ్ మార్చు',
    updateProfile: 'ప్రొఫైల్ నవీకరించు', joinDate: 'చేరిన తేదీ', role: 'పంగు', farmer: 'రైతు', expert: 'వ్యావసాయ నిపుణుడు',
    admin: 'అడ్మిన్', english: 'English', telugu: 'తెలుగు', dataLabels: 'డేటా మూలాలు', general: 'సాధారణం',
    today: 'ఈ రోజు', yesterday: 'నిన్న', addFarm: 'పొలం చేర్చండి', addTask: 'పని చేర్చండి', search: 'వెతకండి',
    results: 'ఫలితాలు', noResults: 'ఫలితాలు దొరకలేదు', tryAgain: 'దయచేసి మళ్లీ ప్రయత్నించండి',
    unavailable: 'తాత్కాలికంగా అందుబాటులో లేదు', liveData: 'లైవ్ డేటా తాత్కాలికంగా అందుబాటులో లేదు. దయచేసి మళ్లీ ప్రయత్నించండి.',
    calculatedData: 'మీ ఇన్‌పుట్లు మరియు పొలం రికార్డుల నుండి లెక్కించబడింది',
  },
};

const CtxLang = createContext<any>(null);
export const useLang = () => useContext(CtxLang);

export function LanguageProvider({ children }: any) {
  const [lang, setLangState] = useState<string>(() => localStorage.getItem('agrishield-lang') || 'en');
  const setLang = (l: string) => { localStorage.setItem('agrishield-lang', l); setLangState(l); };
  const t = (key: string) => (dict[lang] && dict[lang][key]) || dict.en[key] || key;
  return <CtxLang.Provider value={{ lang, setLang, t, dir: 'ltr' }}>{children}</CtxLang.Provider>;
}
