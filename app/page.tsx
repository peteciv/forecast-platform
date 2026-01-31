import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-4xl w-full p-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Forecast Platform
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Regional Financial Forecasting System
        </p>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/admin"
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <h2 className="text-2xl font-semibold mb-2">Admin Center</h2>
            <p className="text-gray-600">
              Configure settings, manage products, and export data
            </p>
          </Link>

          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">Regional Portals</h2>
            <div className="space-y-2">
              <Link
                href="/submit/china"
                className="block p-3 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
              >
                China Portal →
              </Link>
              <Link
                href="/submit/penang"
                className="block p-3 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
              >
                Penang Portal →
              </Link>
              <Link
                href="/submit/mexico"
                className="block p-3 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
              >
                Mexico Portal →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
