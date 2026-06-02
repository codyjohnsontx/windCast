import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-full flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-6 pb-28">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  );
}
