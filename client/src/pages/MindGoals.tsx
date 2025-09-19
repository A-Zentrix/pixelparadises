import { useQuery, useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DefaultThumb from "@assets/image_1758207876569.png";
import { motion } from "framer-motion";
import BackButton from "@/components/BackButton";
import { Play, Music, Coins, Trophy, Star, Clock, Eye, Headphones } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Video {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  posterUrl: string;
  videoUrl: string;
  userId?: string;
  createdAt?: Date;
}

interface Song {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  posterUrl: string;
  audioUrl: string;
  userId?: string;
  createdAt?: Date;
}

interface LocalVideo {
  id: string;
  title: string;
  url: string;
  sizeBytes?: number;
}

interface User {
  id: string;
  username: string;
  level: number;
  xp: number;
  coins: number;
}

export default function MindGoals() {
  const { toast } = useToast();
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [player, setPlayer] = useState<{ src: string; title: string } | null>(null);
  const lastTimeRef = useRef(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Fetch user data for coins display
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Fetch videos
  const { data: videos = [], isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  // Fetch songs  
  const { data: songs = [], isLoading: songsLoading } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  // Fetch local uploaded videos from /videos folder
  const { data: localVideos = [], isLoading: localVideosLoading } = useQuery<LocalVideo[]>({
    queryKey: ["/api/local-videos"],
  });

  // Watch video mutation
  const watchVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await fetch(`/api/videos/${videoId}/watch`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to watch video');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Coins Earned! 🪙",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to award coins",
        variant: "destructive",
      });
    },
  });

  // Listen to song mutation
  const listenSongMutation = useMutation({
    mutationFn: async (songId: string) => {
      const response = await fetch(`/api/songs/${songId}/listen`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to listen to song');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Coins Earned! 🪙", 
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to award coins",
        variant: "destructive",
      });
    },
  });

  if (videosLoading || songsLoading || localVideosLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading">
        <div className="glass-card rounded-2xl p-8">
          <div className="text-white text-xl">Loading your wellness content...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="mind-goals-page">
      <BackButton className="mb-2" />
      {/* Header with Coins Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
        data-testid="header"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-3xl font-bold mb-2">Mind Goals</h1>
            <p className="text-white/70">Enhance your wellness journey with videos and calming sounds</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <Coins className="text-yellow-400 w-6 h-6" />
              <span className="text-white font-bold text-xl" data-testid="user-coins">
                {user?.coins || 0}
              </span>
              <span className="text-white/70 text-sm">coins</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Videos Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-6"
        data-testid="videos-section"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <Play className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold">Wellness Videos</h2>
              <p className="text-white/70 text-sm">Watch and earn 2 coins per video</p>
            </div>
          </div>
          {/* Horizontal scroll replaces pagination */}
        </div>

        {videos.length === 0 ? (
          <div className="text-white/70 text-center py-8">
            No videos available yet. Check back soon!
          </div>
        ) : (
          <>
            <div className="relative">
              <button
                type="button"
                aria-label="Previous"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full w-9 h-9 flex items-center justify-center"
                onClick={() => scrollerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full w-9 h-9 flex items-center justify-center"
                onClick={() => scrollerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
              >
                ›
              </button>
              <div className="overflow-hidden px-11">
                <div ref={scrollerRef} className="flex gap-4 pr-4 overflow-x-auto scrollbar-none">
                  {localVideos.map((video) => (
                    <motion.div
                      key={video.id}
                      whileHover={{ scale: 1.03 }}
                      className="glass-card rounded-xl p-3 flex-shrink-0 w-48"
                      data-testid={`local-video-${video.id}`}
                    >
                      <div className="relative w-48 h-40 rounded-lg overflow-hidden">
                        <img src={DefaultThumb} alt="thumbnail" className="w-full h-full object-cover" />
                        <button
                          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30"
                          onClick={() => { setPlayer({ src: (video as any).url, title: video.title }); setPlayerOpen(true); }}
                          aria-label={`Play ${video.title}`}
                        >
                          <Play className="text-white w-8 h-8" />
                        </button>
                      </div>
                      <h3 className="text-white font-medium mt-2 line-clamp-2" data-testid={`local-video-title-${video.id}`}>
                        {video.title}
                      </h3>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            <Dialog open={playerOpen} onOpenChange={setPlayerOpen}>
              <DialogContent className="max-w-3xl w-[90vw] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6">
                  <DialogTitle className="text-white">{player?.title}</DialogTitle>
                </DialogHeader>
                <div className="bg-black">
                  {player && (
                    <video
                      controls
                      autoPlay
                      preload="metadata"
                      className="w-full h-auto"
                      controlsList="nodownload noplaybackrate noremoteplayback"
                      disablePictureInPicture
                      onLoadedMetadata={(e) => {
                        lastTimeRef.current = e.currentTarget.currentTime || 0;
                        // lock playback rate
                        if (e.currentTarget.playbackRate !== 1) {
                          e.currentTarget.playbackRate = 1;
                        }
                      }}
                      onRateChange={(e) => {
                        if (e.currentTarget.playbackRate !== 1) {
                          e.currentTarget.playbackRate = 1;
                        }
                      }}
                      onKeyDown={(e) => {
                        const blockedKeys = [
                          'ArrowLeft', 'ArrowRight', 'Home', 'End',
                          'j', 'J', 'l', 'L', ',', '.'
                        ];
                        if (blockedKeys.includes(e.key)) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      onTimeUpdate={(e) => {
                        lastTimeRef.current = e.currentTarget.currentTime;
                      }}
                      onSeeking={(e) => {
                        const v = e.currentTarget;
                        // Revert any attempt to jump away from the last known playback position
                        if (Math.abs(v.currentTime - lastTimeRef.current) > 0.5) {
                          v.currentTime = lastTimeRef.current;
                        }
                      }}
                      onSeeked={(e) => {
                        const v = e.currentTarget;
                        if (Math.abs(v.currentTime - lastTimeRef.current) > 0.5) {
                          v.currentTime = lastTimeRef.current;
                        }
                      }}
                    >
                      <source src={player.src} />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </motion.div>

      {/* Songs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-6"
        data-testid="songs-section"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-accent to-secondary rounded-lg flex items-center justify-center">
            <Music className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white text-xl font-semibold">Calming Sounds</h2>
            <p className="text-white/70 text-sm">Listen and earn 2 coins per audio</p>
          </div>
        </div>

        {songs.length === 0 ? (
          <div className="text-white/70 text-center py-8">
            No audio content available yet. Check back soon!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {songs.map((song) => (
              <motion.div
                key={song.id}
                whileHover={{ scale: 1.02 }}
                className="glass-card rounded-xl p-4 cursor-pointer group"
                onClick={() => listenSongMutation.mutate(song.id)}
                data-testid={`song-${song.id}`}
              >
                <div className="flex space-x-4">
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-accent/20 to-secondary/20 flex items-center justify-center">
                    <Headphones className="text-white w-6 h-6 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1" data-testid={`song-title-${song.id}`}>
                      {song.title}
                    </h3>
                    <p className="text-white/70 text-sm mb-2">{song.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-white/60">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{song.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Music className="w-3 h-3" />
                        <span>+2 coins</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Achievement Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-6"
        data-testid="stats-section"
      >
        <h2 className="text-white text-xl font-semibold mb-4 flex items-center space-x-2">
          <Trophy className="text-yellow-400 w-5 h-5" />
          <span>Your Progress</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 text-center">
            <Star className="text-yellow-400 w-8 h-8 mx-auto mb-2" />
            <div className="text-white text-2xl font-bold">Level {user?.level || 7}</div>
            <div className="text-white/70 text-sm">Explorer</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Coins className="text-yellow-400 w-8 h-8 mx-auto mb-2" />
            <div className="text-white text-2xl font-bold">{user?.coins || 0}</div>
            <div className="text-white/70 text-sm">Total Coins</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Trophy className="text-yellow-400 w-8 h-8 mx-auto mb-2" />
            <div className="text-white text-2xl font-bold">{user?.xp || 0}</div>
            <div className="text-white/70 text-sm">Experience</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}