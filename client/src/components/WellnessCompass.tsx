import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const moodEmojis = [
  { emoji: "😊", mood: "happy", label: "Happy" },
  { emoji: "😌", mood: "calm", label: "Calm" },
  { emoji: "🤔", mood: "thoughtful", label: "Thoughtful" },
  { emoji: "⭐", mood: "energetic", label: "Energetic" },
  { emoji: "😅", mood: "restless", label: "Restless" },
];

export default function WellnessCompass() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: moodEntries } = useQuery({
    queryKey: ['/api/user/mood'],
  });

  const moodMutation = useMutation({
    mutationFn: async (mood: string) => {
      return apiRequest('POST', '/api/user/mood', { mood });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/mood'] });
    },
  });

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    moodMutation.mutate(mood);
  };

  // Calculate mood distribution
  const moodCounts = (moodEntries as any[])?.reduce((acc: Record<string, number>, entry: any) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {}) || {};

  const totalEntries = (moodEntries as any[])?.length || 0;
  const dominantMood = totalEntries > 0 
    ? Object.entries(moodCounts).reduce((a, b) => moodCounts[a[0]] > moodCounts[b[0]] ? a : b)[0]
    : "calm";
  
  const dominantPercentage = totalEntries > 0 
    ? Math.round((moodCounts[dominantMood] / totalEntries) * 100) 
    : 76;

  return (
    <div className="glass-card rounded-3xl p-6" data-testid="wellness-compass">
      <h3 className="text-white font-semibold mb-4">Your Wellness Compass</h3>
      
      <div className="flex justify-between mb-4" data-testid="mood-emojis">
        {moodEmojis.map((item) => (
          <motion.div
            key={item.mood}
            className="mood-emoji text-2xl cursor-pointer"
            title={item.label}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 1.1 }}
            onClick={() => handleMoodSelect(item.mood)}
            animate={{
              scale: selectedMood === item.mood ? 1.3 : 1,
              opacity: selectedMood === item.mood ? 1 : 0.7,
            }}
            data-testid={`mood-emoji-${item.mood}`}
          >
            {item.emoji}
          </motion.div>
        ))}
      </div>
      
      <div className="text-white/70 text-sm mb-2">
        Mostly {dominantMood} mood
      </div>
      <div className="text-white font-medium mb-3" data-testid="mood-percentage">
        {dominantPercentage}% is {dominantMood.charAt(0).toUpperCase() + dominantMood.slice(1)}
      </div>
      
      <div className="flex space-x-1 h-2" data-testid="mood-chart">
        {moodEmojis.map((item, index) => {
          const percentage = totalEntries > 0 ? (moodCounts[item.mood] || 0) / totalEntries : 0.2;
          const colors = [
            "bg-green-400", "bg-green-300", "bg-blue-300", 
            "bg-blue-400", "bg-purple-300", "bg-purple-400"
          ];
          
          return (
            <motion.div
              key={item.mood}
              className={`flex-1 rounded ${colors[index % colors.length]}`}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: percentage }}
              transition={{ delay: index * 0.1 }}
              data-testid={`mood-bar-${item.mood}`}
            />
          );
        })}
      </div>
    </div>
  );
}
