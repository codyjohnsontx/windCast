import { Outlet } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-6 pb-28">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  );
}
