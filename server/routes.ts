import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMoodEntrySchema, insertGameScoreSchema, insertUserProgressSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
