import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import Recreation from "@/pages/Recreation";
import Games from "@/pages/Games";
import MindGoals from "@/pages/MindGoals";
import Snake from "@/pages/Snake";
import Sidebar from "@/components/Sidebar";

function Router() {
  return (
    <div className="flex h-screen relative z-10">
      <Sidebar />
      <div className="flex-1 p-4 pl-2 overflow-y-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/recreation" component={Recreation} />
          <Route path="/games" component={Games} />
          <Route path="/games/snake" component={Snake} />
          <Route path="/goals" component={MindGoals} />
          <Route path="/knowledge" component={() => <div className="text-white text-2xl">Knowledge Bank - Coming Soon</div>} />
          <Route path="/discovery" component={() => <div className="text-white text-2xl">Discovery - Coming Soon</div>} />
          <Route component={() => <div className="text-white text-2xl">Page Not Found</div>} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
