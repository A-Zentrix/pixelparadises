import { Brain, Puzzle, Clock, Lightbulb, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

const featuredGames = [
  {
    title: "Math Galaxy Quest",
    description: "Solve mathematical equations while exploring distant galaxies and discovering new star systems.",
    image: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200",
    rating: 4.9,
    xp: 50,
    gradient: "from-primary to-secondary",
    badge: "New",
    badgeColor: "from-yellow-400 to-orange-400"
  },
  {
    title: "Language Constellation",
    description: "Connect words and build vocabulary while mapping linguistic star patterns across cultures.",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200",
    rating: 4.7,
    xp: 40,
    gradient: "from-green-500 to-emerald-500",
    badge: "Popular",
    badgeColor: "from-green-400 to-emerald-400"
  },
  {
    title: "Science Lab Simulator",
    description: "Conduct virtual experiments and discover scientific principles in a safe digital laboratory.",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200",
    rating: 4.8,
    xp: 60,
    gradient: "from-purple-500 to-pink-500",
    badge: "Updated",
    badgeColor: "from-purple-400 to-pink-400"
  }
];

const dailyChallenges = [
  {
    icon: Brain,
    title: "Memory Matrix",
    description: "Remember the pattern",
    gradient: "from-red-400 to-pink-400",
    action: "Play"
  },
  {
    icon: Puzzle,
    title: "Logic Puzzle", 
    description: "Solve in 5 minutes",
    gradient: "from-blue-400 to-cyan-400",
    action: "Solve"
  },
  {
    icon: Clock,
    title: "Speed Quiz",
    description: "20 questions",
    gradient: "from-green-400 to-teal-400", 
    action: "Start"
  },
  {
    icon: Lightbulb,
    title: "Creative Mode",
    description: "Build & learn",
    gradient: "from-yellow-400 to-orange-400",
    action: "Create"
  }
];

export default function Games() {
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  const { data: userProgress } = useQuery({
    queryKey: ['/api/user/progress'],
  });

  const progressData = userProgress || [
    { subject: "Mathematics", level: 8, progress: 75 },
    { subject: "Science", level: 6, progress: 60 },
    { subject: "Languages", level: 7, progress: 90 }
  ];

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6" data-testid="games-header">
        <h1 className="text-white text-3xl font-bold">PlayZone</h1>
        <div className="flex items-center space-x-4">
          <div className="glass-card px-4 py-2 rounded-full">
            <span className="text-white/90 text-sm">Level {user?.level || 7} Explorer</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-full">
            <span className="text-white/90 text-sm">⭐ {user?.xp || 2450} XP</span>
          </div>
        </div>
      </div>

      {/* Featured Games */}
      <div className="mb-8">
        <h2 className="text-white text-xl font-semibold mb-4">Featured Learning Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredGames.map((game, index) => (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="game-card glass-card rounded-3xl p-6"
              data-testid={`featured-game-${index}`}
            >
              <div className="relative mb-4">
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-full h-32 object-cover rounded-xl"
                />
                <div className={`absolute top-2 right-2 bg-gradient-to-r ${game.badgeColor} text-white px-2 py-1 rounded-lg text-xs font-medium`}>
                  {game.badge}
                </div>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{game.title}</h3>
              <p className="text-white/70 text-sm mb-4">{game.description}</p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(game.rating) ? 'fill-current' : ''}`}
                      />
                    ))}
                  </div>
                  <span className="text-white/60 text-sm">{game.rating}</span>
                </div>
                <span className="text-accent text-sm font-medium">+{game.xp} XP</span>
              </div>
              <button 
                className={`w-full bg-gradient-to-r ${game.gradient} text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all`}
                data-testid={`play-${game.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                Launch Mission
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Daily Challenges */}
      <div className="mb-8">
        <h2 className="text-white text-xl font-semibold mb-4">Daily Challenges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dailyChallenges.map((challenge, index) => {
            const Icon = challenge.icon;
            return (
              <motion.div
                key={challenge.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="glass-card rounded-2xl p-4 text-center"
                data-testid={`challenge-${index}`}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${challenge.gradient} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="text-white text-lg" />
                </div>
                <h4 className="text-white font-medium mb-2">{challenge.title}</h4>
                <p className="text-white/60 text-xs mb-3">{challenge.description}</p>
                <button 
                  className={`bg-gradient-to-r ${challenge.gradient} text-white px-4 py-2 rounded-lg text-sm w-full`}
                  data-testid={`challenge-${challenge.action.toLowerCase()}`}
                >
                  {challenge.action}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Learning Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card rounded-3xl p-8"
        data-testid="learning-progress"
      >
        <h2 className="text-white text-xl font-semibold mb-6">Learning Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {progressData.map((subject, index) => (
            <div key={subject.subject} data-testid={`progress-${subject.subject.toLowerCase()}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{subject.subject}</span>
                <span className="text-accent font-medium">Level {subject.level}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${subject.progress}%` }}
                  transition={{ delay: 0.9 + index * 0.1, duration: 0.8 }}
                  className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full"
                />
              </div>
              <p className="text-white/60 text-sm">{subject.progress}% to next level</p>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
