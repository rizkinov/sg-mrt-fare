import FareCalculator from "@/components/fare-calculator";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen py-10 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3">Singapore MRT Fare Calculator</h1>
          <p className="text-muted-foreground text-lg">Select your starting and destination stations to calculate the fare</p>
        </header>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <FareCalculator />
        </div>
        
        <footer className="mt-12 text-center text-sm text-muted-foreground border-t pt-6">
          <p>Fare data based on latest information as of December 2024</p>
          <p className="mt-2">This is an unofficial tool and fares may vary. Please refer to official sources for the most accurate information.</p>
        </footer>
      </div>
    </main>
  );
} 