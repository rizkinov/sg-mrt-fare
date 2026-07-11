import FareCalculator from "@/components/fare-calculator";

export default function Home() {
  return (
    <main className="min-h-dvh py-10 px-2 sm:px-4 bg-[#faf9f7] dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <a
            href="https://www.lifekit.sg"
            className="font-mono text-xs tracking-widest uppercase text-neutral-500 hover:text-[#b5484d] transition-colors"
          >
            lifekit.sg / transport
          </a>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3 mb-3">
            Singapore MRT Fare Calculator
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl text-pretty">
            Pick your start and destination stations to estimate the card fare for the trip.
          </p>
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-neutral-200/80 dark:border-gray-700 shadow-sm p-3 sm:p-6 mb-8">
          <FareCalculator />
        </div>

        <footer className="mt-12 text-sm text-muted-foreground border-t pt-6 space-y-2">
          <p>Fare calculations are based on data from the Land Transport Authority (LTA) and data.gov.sg. Fares effective from 27 December 2025.</p>
          <p>Station network as of 12 July 2026, including Circle Line Stage 6 (Keppel, Cantonment and Prince Edward Road).</p>
          <p>Actual fares may vary slightly from the calculated amounts. Distance calculations are approximate.</p>
          <p className="pt-2">
            Part of{" "}
            <a href="https://www.lifekit.sg" className="underline underline-offset-2 hover:text-[#b5484d] transition-colors">
              lifekit.sg
            </a>{" "}
            — free tools for living in Singapore.
          </p>
        </footer>
      </div>
    </main>
  );
}
