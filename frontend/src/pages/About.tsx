import { Card, DataLabel } from '../components/ui';

export default function About() {
  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-3xl font-bold">About AgriShield AI</h1>
      <Card>
        <h2 className="font-bold text-lg">Problem</h2>
        <p className="text-gray-600">Farmers face challenges with disease identification, soil management, water management, weather uncertainty, market information, profit planning and access to agricultural guidance.</p>
      </Card>
      <Card>
        <h2 className="font-bold text-lg">Solution</h2>
        <p className="text-gray-600">AgriShield AI combines agricultural data, AI-assisted analysis and decision-support tools into one platform.</p>
      </Card>
      <Card>
        <h2 className="font-bold text-lg">Data Source Legend</h2>
        <p className="text-sm text-gray-500 mb-3">Every dataset shown in AgriShield is labeled with its source type so you always know how a number was produced:</p>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="pt-0.5"><DataLabel type="live" /></span>
            <span><b>Live data</b> — fetched in real time from live weather or market services at the moment of your request.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="pt-0.5"><DataLabel type="latest" /></span>
            <span><b>Latest available data</b> — the most recent record available from government or reference datasets (may be hours or days old).</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="pt-0.5"><DataLabel type="database" /></span>
            <span><b>Database data</b> — stored records from your own farm activities in the AgriShield database.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="pt-0.5"><DataLabel type="calculated" /></span>
            <span><b>Calculated data</b> — computed on the server from your inputs and farm records (soil scores, irrigation advice, profit estimates).</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="pt-0.5"><DataLabel type="ai" /></span>
            <span><b>AI analysis</b> — produced by the Python AI service (crop disease and pest detection from images).</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="pt-0.5"><DataLabel type="demo" /></span>
            <span><b>Demo / simulated data</b> — simulated values for demonstration (e.g. satellite NDVI imagery). Not real measurements.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="pt-0.5"><DataLabel type="unavailable" /></span>
            <span><b>Data unavailable</b> — the external service is temporarily unreachable; no data is shown rather than guessing.</span>
          </li>
        </ul>
      </Card>
      <Card>
        <h2 className="font-bold text-lg">Innovation</h2>
        <p className="text-xl font-semibold text-green-800">“From crop image to actionable farming decision.”</p>
      </Card>
      <Card>
        <h2 className="font-bold text-lg">Social Impact</h2>
        <ul className="list-disc list-inside text-gray-600">
          <li>Reduce crop losses</li><li>Improve water efficiency</li><li>Improve agricultural decision-making</li><li>Support rural communities</li><li>Encourage sustainable farming</li><li>Improve access to agricultural information</li>
        </ul>
      </Card>
      <Card>
        <h2 className="font-bold text-lg">How It Works</h2>
        <p className="whitespace-pre-line text-gray-600">{'🌾 FARM DATA\n      ↓\n🤖 AI ANALYSIS\n      ↓\n⚠️ RISK DETECTION\n      ↓\n📊 FARM INSIGHTS\n      ↓\n💡 RECOMMENDATIONS\n      ↓\n👨‍🌾 BETTER FARMING DECISIONS'}</p>
      </Card>
    </div>
  );
}
