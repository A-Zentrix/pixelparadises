import { Search } from "lucide-react";
import OrbitalInterface from "@/components/OrbitalInterface";
import WellnessCompass from "@/components/WellnessCompass";

export default function Dashboard() {
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6" data-testid="dashboard-header">
        <h1 className="text-white text-3xl font-bold">Daily Orbit</h1>
        <div className="flex items-center space-x-4">
          <div className="glass-card px-4 py-2 rounded-full">
            <span className="text-white/90 text-sm">Rewrite Items</span>
          </div>
          <div className="w-10 h-10 glass-card rounded-full flex items-center justify-center">
            <Search className="text-white/90 w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Central Orbital Interface */}
        <div className="col-span-8">
          <OrbitalInterface />
        </div>

        {/* Right Sidebar Widgets */}
        <div className="col-span-4 space-y-6">
          {/* Wellness Compass */}
          <WellnessCompass />

          {/* New Starfaring Lecture */}
          <div className="glass-card rounded-3xl p-6" data-testid="starfaring-lecture">
            <h3 className="text-white font-semibold mb-4">New Starfaring Lecture</h3>
            <div className="flex space-x-4">
              <img
                src="https://images.unsplash.com/photo-1502134249126-9f3755a50d78?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
                alt="Spiral galaxy with vibrant cosmic colors"
                className="w-16 h-16 rounded-xl object-cover"
                data-testid="galaxy-image"
              />
              <div>
                <h4 className="text-white font-medium text-sm">Astrophysics 100:</h4>
                <p className="text-white/70 text-sm">Galactic Evolution - Module 3</p>
              </div>
            </div>
          </div>

          {/* Peer Constellation Forum */}
          <div className="glass-card rounded-3xl p-6" data-testid="constellation-forum">
            <h3 className="text-white font-semibold mb-4">Peer Constellation Forum</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
                <div className="flex-1">
                  <p className="text-white/90 text-sm">Thread: "Coping with exam star-charts"</p>
                  <p className="text-white/60 text-xs">5 new replies</p>
                </div>
                <div className="w-6 h-6 bg-gradient-to-r from-accent to-secondary rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
