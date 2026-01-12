import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import Scorer from "./pages/Scorer";
import Leaderboard from "./pages/Leaderboard";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <div className="font-bold">⛳ Golf Score</div>
            <nav className="flex gap-3 text-sm">
              <Link className="px-3 py-1 rounded hover:bg-gray-100" to="/">
                Scorer
              </Link>
              <Link className="px-3 py-1 rounded hover:bg-gray-100" to="/leaderboard">
                Leaderboard
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">
          <Routes>
            <Route path="/" element={<Scorer />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
