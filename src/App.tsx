import { Analytics } from "@vercel/analytics/react";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          My Google AI Studio App
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Welcome to your application with Vercel Web Analytics enabled!
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            ✅ Vercel Web Analytics is now tracking your visitors and page views.
          </p>
        </div>
      </div>
      <Analytics />
    </div>
  );
}
