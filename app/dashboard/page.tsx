import Dither from "@/components/ui/Dither/Dither"; 

interface DashboardPageProps {}

export default function DashboardPage({}: DashboardPageProps) {
  // Données fictives pour l'instant
  const stats = {
    overallPerformance: "17%",
    winrate: "86%", 
    totalTrades: 150,
    takeProfits: 90,
    stopLosses: 45,
    breakEvens: 15,
  };

  const primaryAccentRGB: [number, number, number] = [0.494, 0.357, 0.937];

  return (
    <div className="relative min-h-screen selection:bg-purple-500 selection:text-white">
      <div className="absolute inset-0 z-0">
        <Dither
          waveColor={primaryAccentRGB}
          waveAmplitude={0.05}
          waveFrequency={0.5}
          pixelSize={1} 
          colorNum={5}       
          waveSpeed={0.01}    
          enableMouseInteraction={true}
          mouseRadius={0.3}
        />
      </div>

      {/* Contenu principal superposé */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 text-gray-100 pointer-events-none">
        <div className="w-full max-w-6xl space-y-8 bg-gray-900/70 backdrop-blur-lg p-8 md:p-10 shadow-2xl shadow-purple-500/20 border pointer-events-auto">
          <header className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Dashboard
            </h1>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Performance Globale */}
            <div className="bg-gray-800/80 p-6 rounded-md shadow-xl backdrop-blur-md border border-gray-700/60 hover:border-purple-500/70 transition-colors duration-300">
              <h2 className="text-xl font-semibold text-purple-300 mb-3">Performance Globale</h2>
              <p className="text-3xl font-bold">{stats.overallPerformance}</p>
            </div>
            {/* Winrate */}
            <div className="bg-gray-800/80 p-6 rounded-md shadow-xl backdrop-blur-md border border-gray-700/60 hover:border-purple-500/70 transition-colors duration-300">
              <h2 className="text-xl font-semibold text-purple-300 mb-3">Winrate</h2>
              <p className="text-3xl font-bold">{stats.winrate}</p>
            </div>
            {/* Trades Total */}
            <div className="bg-gray-800/80 p-6 rounded-md shadow-xl backdrop-blur-md border border-gray-700/60 hover:border-purple-500/70 transition-colors duration-300">
              <h2 className="text-xl font-semibold text-purple-300 mb-3">Trades Total</h2>
              <p className="text-3xl font-bold">{stats.totalTrades}</p>
            </div>
            {/* Take Profits (TP) */}
            <div className="bg-gray-800/80 p-6 rounded-md shadow-xl backdrop-blur-md border border-gray-700/60 hover:border-purple-500/70 transition-colors duration-300">
              <h2 className="text-xl font-semibold text-purple-300 mb-3">Take Profits (TP)</h2>
              <p className="text-3xl font-bold">{stats.takeProfits}</p>
            </div>
            {/* Stop Losses (SL) */}
            <div className="bg-gray-800/80 p-6 rounded-md shadow-xl backdrop-blur-md border border-gray-700/60 hover:border-purple-500/70 transition-colors duration-300">
              <h2 className="text-xl font-semibold text-purple-300 mb-3">Stop Losses (SL)</h2>
              <p className="text-3xl font-bold">{stats.stopLosses}</p>
            </div>
            {/* Break Evens (BE) */}
            <div className="bg-gray-800/80 p-6 rounded-md shadow-xl backdrop-blur-md border border-gray-700/60 hover:border-purple-500/70 transition-colors duration-300">
              <h2 className="text-xl font-semibold text-purple-300 mb-3">Break Evens (BE)</h2>
              <p className="text-3xl font-bold">{stats.breakEvens}</p>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-semibold text-purple-400 mb-5 text-center md:text-left">
              Performances Détaillées
            </h2>
            <div className="bg-gray-800/80 p-6 rounded-md shadow-xl min-h-[200px] flex items-center justify-center backdrop-blur-md border border-gray-700/60">
              <p className="text-gray-400">Graphiques et données détaillées à venir...</p>
            </div>
          </section>
        </div>
        <p className="mt-8 text-xs text-gray-500 text-center relative z-10 pointer-events-auto">
          YH Trading Journal &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
} 