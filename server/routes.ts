import type { Express } from "express";
import express from "express";
import fs from "fs";
import path from "path";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMoodEntrySchema, insertGameScoreSchema, insertUserProgressSchema, insertMovieSchema, insertVideoSchema, insertSongSchema, insertRewardSchema, updateMovieSchema, updateVideoSchema, updateSongSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve local videos statically
  const videosDir = path.resolve(import.meta.dirname, "..", "videos");
  if (fs.existsSync(videosDir)) {
    app.use("/videos", express.static(videosDir));
  }

  // Get current user (default user for demo)
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser("user-1");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user progress
  app.get("/api/user/progress", async (req, res) => {
    try {
      const progress = await storage.getUserProgress("user-1");
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  // Update user progress
  app.post("/api/user/progress", async (req, res) => {
    try {
      const validatedData = insertUserProgressSchema.parse({
        ...req.body,
        userId: "user-1"
      });
      const progress = await storage.createOrUpdateUserProgress(validatedData);
      res.json(progress);
    } catch (error) {
      res.status(400).json({ message: "Invalid progress data" });
    }
  });

  // Get user mood entries
  app.get("/api/user/mood", async (req, res) => {
    try {
      const moodEntries = await storage.getUserMoodEntries("user-1", 30);
      res.json(moodEntries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood entries" });
    }
  });

  // Create mood entry
  app.post("/api/user/mood", async (req, res) => {
    try {
      const validatedData = insertMoodEntrySchema.parse({
        ...req.body,
        userId: "user-1"
      });
      const moodEntry = await storage.createMoodEntry(validatedData);
      res.json(moodEntry);
    } catch (error) {
      res.status(400).json({ message: "Invalid mood data" });
    }
  });

  // List local videos from the project's /videos directory
  app.get("/api/local-videos", async (_req, res) => {
    try {
      if (!fs.existsSync(videosDir)) {
        return res.json([]);
      }
      const entries = await fs.promises.readdir(videosDir, { withFileTypes: true });
      const files = entries
        .filter((e) => e.isFile() && /\.(mp4|webm|ogg)$/i.test(e.name))
        .map((e) => e.name);

      const withMeta = await Promise.all(
        files.map(async (fileName) => {
          const filePath = path.join(videosDir, fileName);
          const stat = await fs.promises.stat(filePath);
          const title = fileName.replace(/[_-]+/g, " ").replace(/\.[^.]+$/, "");
          return {
            id: fileName,
            title,
            url: `/videos/${encodeURIComponent(fileName)}`,
            sizeBytes: stat.size,
          };
        })
      );

      res.json(withMeta);
    } catch (error) {
      res.status(500).json({ message: "Failed to list local videos" });
    }
  });

  // Get user game scores
  app.get("/api/user/scores", async (req, res) => {
    try {
      const { gameId } = req.query;
      const scores = await storage.getUserGameScores("user-1", gameId as string);
      res.json(scores);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game scores" });
    }
  });

  // Create game score
  app.post("/api/user/scores", async (req, res) => {
    try {
      const validatedData = insertGameScoreSchema.parse({
        ...req.body,
        userId: "user-1"
      });
      
      // Update user XP
      const currentUser = await storage.getUser("user-1");
      if (currentUser) {
        await storage.updateUser("user-1", {
          xp: currentUser.xp + validatedData.xpEarned
        });
      }

      const gameScore = await storage.createGameScore(validatedData);
      res.json(gameScore);
    } catch (error) {
      res.status(400).json({ message: "Invalid score data" });
    }
  });

  // Movie routes
  app.get("/api/movies", async (req, res) => {
    try {
      const { category } = req.query;
      const movies = await storage.getMovies(category as string);
      res.json(movies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch movies" });
    }
  });

  app.get("/api/movies/:id", async (req, res) => {
    try {
      const movie = await storage.getMovie(req.params.id);
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }
      res.json(movie);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch movie" });
    }
  });

  app.post("/api/movies", async (req, res) => {
    try {
      const validatedData = insertMovieSchema.parse(req.body);
      const movie = await storage.createMovie(validatedData);
      res.status(201).json(movie);
    } catch (error) {
      res.status(400).json({ message: "Invalid movie data" });
    }
  });

  app.put("/api/movies/:id", async (req, res) => {
    try {
      const validatedUpdates = updateMovieSchema.parse(req.body);
      const movie = await storage.updateMovie(req.params.id, validatedUpdates);
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }
      res.json(movie);
    } catch (error) {
      res.status(422).json({ message: "Invalid update data", details: error });
    }
  });

  app.delete("/api/movies/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMovie(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Movie not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete movie" });
    }
  });

  // Video routes
  app.get("/api/videos", async (req, res) => {
    try {
      const { category } = req.query;
      const videos = await storage.getVideos(category as string);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  app.post("/api/videos", async (req, res) => {
    try {
      const validatedData = insertVideoSchema.parse({
        ...req.body,
        userId: "user-1"
      });
      const video = await storage.createVideo(validatedData);
      res.status(201).json(video);
    } catch (error) {
      res.status(400).json({ message: "Invalid video data" });
    }
  });

  app.put("/api/videos/:id", async (req, res) => {
    try {
      const validatedUpdates = updateVideoSchema.parse(req.body);
      const video = await storage.updateVideo(req.params.id, validatedUpdates);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      res.status(422).json({ message: "Invalid update data", details: error });
    }
  });

  app.delete("/api/videos/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteVideo(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete video" });
    }
  });

  app.post("/api/videos/:id/watch", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Award coins for watching video (2 coins per video)
      const transaction = await storage.earnCoins("user-1", 2, "video", req.params.id, `Watched: ${video.title}`);
      res.json({ message: "Coins earned!", transaction });
    } catch (error) {
      res.status(500).json({ message: "Failed to award coins" });
    }
  });

  // Song routes
  app.get("/api/songs", async (req, res) => {
    try {
      const { category } = req.query;
      const songs = await storage.getSongs(category as string);
      res.json(songs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch songs" });
    }
  });

  app.get("/api/songs/:id", async (req, res) => {
    try {
      const song = await storage.getSong(req.params.id);
      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch song" });
    }
  });

  app.post("/api/songs", async (req, res) => {
    try {
      const validatedData = insertSongSchema.parse({
        ...req.body,
        userId: "user-1"
      });
      const song = await storage.createSong(validatedData);
      res.status(201).json(song);
    } catch (error) {
      res.status(400).json({ message: "Invalid song data" });
    }
  });

  app.put("/api/songs/:id", async (req, res) => {
    try {
      const validatedUpdates = updateSongSchema.parse(req.body);
      const song = await storage.updateSong(req.params.id, validatedUpdates);
      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      res.status(422).json({ message: "Invalid update data", details: error });
    }
  });

  app.delete("/api/songs/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSong(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Song not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete song" });
    }
  });

  app.post("/api/songs/:id/listen", async (req, res) => {
    try {
      const song = await storage.getSong(req.params.id);
      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }
      
      // Award coins for listening to song (2 coins per song)
      const transaction = await storage.earnCoins("user-1", 2, "song", req.params.id, `Listened to: ${song.title}`);
      res.json({ message: "Coins earned!", transaction });
    } catch (error) {
      res.status(500).json({ message: "Failed to award coins" });
    }
  });

  // Coin transaction routes
  app.get("/api/user/coins/transactions", async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      const transactions = await storage.getUserCoinTransactions("user-1", parseInt(limit as string));
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/user/coins/earn", async (req, res) => {
    try {
      const { amount, source, sourceId, description } = req.body;
      
      // Validate input data
      if (!amount || typeof amount !== 'number' || amount <= 0 || amount > 100) {
        return res.status(400).json({ message: "Invalid amount - must be a positive number up to 100" });
      }
      
      if (!source || typeof source !== 'string' || !['achievement', 'daily', 'bonus'].includes(source)) {
        return res.status(400).json({ message: "Invalid source - must be achievement, daily, or bonus" });
      }
      
      const transaction = await storage.earnCoins("user-1", amount, source, sourceId, description);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to earn coins" });
    }
  });

  // Reward routes
  app.get("/api/rewards", async (req, res) => {
    try {
      const { category, available } = req.query;
      const isAvailable = available === 'true' ? true : available === 'false' ? false : undefined;
      const rewards = await storage.getRewards(category as string, isAvailable);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.get("/api/rewards/:id", async (req, res) => {
    try {
      const reward = await storage.getReward(req.params.id);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      res.json(reward);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reward" });
    }
  });

  app.post("/api/rewards", async (req, res) => {
    try {
      const validatedData = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(validatedData);
      res.status(201).json(reward);
    } catch (error) {
      res.status(400).json({ message: "Invalid reward data" });
    }
  });

  // User reward routes
  app.get("/api/user/rewards", async (req, res) => {
    try {
      const userRewards = await storage.getUserRewards("user-1");
      res.json(userRewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user rewards" });
    }
  });

  app.post("/api/user/rewards/:rewardId/redeem", async (req, res) => {
    try {
      const userReward = await storage.redeemReward("user-1", req.params.rewardId);
      if (!userReward) {
        return res.status(400).json({ message: "Unable to redeem reward - insufficient coins or reward unavailable" });
      }
      res.json(userReward);
    } catch (error) {
      res.status(500).json({ message: "Failed to redeem reward" });
    }
  });

  app.put("/api/user/rewards/:id/use", async (req, res) => {
    try {
      const userReward = await storage.markRewardAsUsed(req.params.id);
      if (!userReward) {
        return res.status(404).json({ message: "User reward not found" });
      }
      res.json(userReward);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark reward as used" });
    }
  });

  // Search route
  app.get("/api/search", async (req, res) => {
    try {
      const { q, category, limit = 20 } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const results = await storage.searchContent(q as string, category as string, parseInt(limit as string));
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
