import { Outlet, Link } from "@tanstack/react-router";
import { createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="p-4 border-b border-neutral-800">
        <nav className="flex gap-4 text-sm">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/studio" className="hover:underline">Studio</Link>
          <Link to="/export" className="hover:underline">Export</Link>
        </nav>
      </header>
      <main className="p-6"><Outlet /></main>
    </div>
  ),
});