import FareCalculator from "@/components/fare-calculator";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen py-10 px-2 sm:px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3">Singapore MRT Fare Calculator</h1>
          <p className="text-muted-foreground text-lg">Select your starting and destination stations to calculate the fare</p>
        </header>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 sm:p-6 mb-8">
          <FareCalculator />
        </div>
        
        <footer className="mt-12 text-center text-sm text-muted-foreground border-t pt-6">
          <p>Fare calculations are based on data from the Land Transport Authority (LTA) and data.gov.sg.</p>
          <p className="mt-2">Actual fares may vary slightly from the calculated amounts. Distance calculations are approximate.</p>
        </footer>
      </div>
    </main>
  );
} 