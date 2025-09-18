import { Palette, Leaf, Wind, Sun, Music, Heart } from "lucide-react";
import { motion } from "framer-motion";

const activities = [
  {
    icon: Heart,
    title: "Mindful Meditation",
    description: "Guided meditation sessions to help you find inner peace and focus.",
    sessions: "15 Sessions Available",
    gradient: "from-purple-500 to-pink-500",
    button: "Start Session"
  },
  {
    icon: Wind,
    title: "Breathing Exercises", 
    description: "Interactive breathing patterns to reduce stress and improve focus.",
    sessions: "4-7-8 Technique",
    gradient: "from-cyan-500 to-blue-500",
    button: "Breathe"
  },
  {
    icon: Leaf,
    title: "Nature Soundscapes",
    description: "Calming nature sounds to help you relax and concentrate.",
    sessions: "Rain, Ocean, Forest",
    gradient: "from-green-500 to-emerald-500", 
    button: "Listen"
  },
  {
    icon: Sun,
    title: "Yoga & Stretching",
    description: "Simple yoga poses and stretches to release tension and improve posture.",
    sessions: "12 Routines",
    gradient: "from-orange-500 to-red-500",
    button: "Stretch"
  },
  {
    icon: Palette,
    title: "Creative Arts",
    description: "Digital drawing, creative writing, and artistic expression tools.",
    sessions: "Canvas & Journal",
    gradient: "from-indigo-500 to-purple-500",
    button: "Create"
  },
  {
    icon: Music,
    title: "Music Therapy",
    description: "Therapeutic music sessions and interactive sound healing.",
    sessions: "Binaural Beats", 
    gradient: "from-pink-500 to-rose-500",
    button: "Play"
  }
];

const wellnessStats = [
  { value: 24, label: "Minutes Meditated", goal: "Goal: 30 min", gradient: "from-green-400 to-blue-400" },
  { value: 8, label: "Breathing Sessions", goal: "Goal: 10 sessions", gradient: "from-purple-400 to-pink-400" },
  { value: 15, label: "Yoga Minutes", goal: "Goal: 20 min", gradient: "from-orange-400 to-red-400" },
  { value: 3, label: "Art Creations", goal: "Goal: 5 pieces", gradient: "from-cyan-400 to-teal-400" }
];

export default function Recreation() {
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6" data-testid="recreation-header">
        <h1 className="text-white text-3xl font-bold">Recreation Center</h1>
        <div className="glass-card px-4 py-2 rounded-full">
          <span className="text-white/90 text-sm">Wellness Zone</span>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <motion.div
              key={activity.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-3xl p-6 hover:scale-105 transition-all duration-300"
              data-testid={`activity-${activity.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${activity.gradient} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="text-white text-xl" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{activity.title}</h3>
              <p className="text-white/70 text-sm mb-4">{activity.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-accent text-sm font-medium">{activity.sessions}</span>
                <button 
                  className={`bg-gradient-to-r ${activity.gradient} text-white px-4 py-2 rounded-xl text-sm hover:shadow-lg transition-all`}
                  data-testid={`button-${activity.button.toLowerCase()}`}
                >
                  {activity.button}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Wellness Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card rounded-3xl p-8"
        data-testid="wellness-dashboard"
      >
        <h2 className="text-white text-xl font-semibold mb-6">Today's Wellness Journey</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {wellnessStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="text-center"
              data-testid={`wellness-stat-${index}`}
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${stat.gradient} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <span className="text-white font-bold text-xl">{stat.value}</span>
              </div>
              <p className="text-white font-medium">{stat.label}</p>
              <p className="text-white/60 text-sm">{stat.goal}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
