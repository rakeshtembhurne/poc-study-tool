export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
        <h1 className="text-4xl font-bold text-white mb-4 text-center">
          🎉 Tailwind CSS is Working! 🎉
        </h1>
        <p className="text-white/80 text-lg text-center mb-6">
          Beautiful gradients, blur effects, and modern styling
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-all duration-300 hover:scale-105">
            Button 1
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-300 hover:scale-105 shadow-lg">
            Button 2
          </button>
        </div>
      </div>

      {/* Floating animation elements */}
      <div className="absolute top-20 left-20 w-20 h-20 bg-white/10 rounded-full animate-bounce"></div>
      <div className="absolute bottom-20 right-20 w-16 h-16 bg-yellow-300/20 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-pink-300/20 rounded-full animate-ping"></div>
    </div>
  );
}
