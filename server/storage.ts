import { type User, type InsertUser, type UserProgress, type InsertUserProgress, type MoodEntry, type InsertMoodEntry, type GameScore, type InsertGameScore } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // User progress methods
  getUserProgress(userId: string): Promise<UserProgress[]>;
  getUserProgressBySubject(userId: string, subject: string): Promise<UserProgress | undefined>;
  createOrUpdateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;

  // Mood tracking methods
  getUserMoodEntries(userId: string, limit?: number): Promise<MoodEntry[]>;
  createMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry>;

  // Game score methods
  getUserGameScores(userId: string, gameId?: string): Promise<GameScore[]>;
  createGameScore(gameScore: InsertGameScore): Promise<GameScore>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private userProgress: Map<string, UserProgress>;
  private moodEntries: Map<string, MoodEntry>;
  private gameScores: Map<string, GameScore>;

  constructor() {
    this.users = new Map();
    this.userProgress = new Map();
    this.moodEntries = new Map();
    this.gameScores = new Map();

    // Create default user
    const defaultUser: User = {
      id: "user-1",
      username: "AstroBeth",
      level: 7,
      xp: 2450,
      avatar: null,
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create default progress data
    const mathProgress: UserProgress = {
      id: "progress-1",
      userId: "user-1",
      subject: "Mathematics",
      level: 8,
      progress: 75,
      lastActivity: new Date(),
    };
    this.userProgress.set(mathProgress.id, mathProgress);

    const scienceProgress: UserProgress = {
      id: "progress-2",
      userId: "user-1",
      subject: "Science",
      level: 6,
      progress: 60,
      lastActivity: new Date(),
    };
    this.userProgress.set(scienceProgress.id, scienceProgress);

    const languageProgress: UserProgress = {
      id: "progress-3",
      userId: "user-1",
      subject: "Languages",
      level: 7,
      progress: 90,
      lastActivity: new Date(),
    };
    this.userProgress.set(languageProgress.id, languageProgress);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      level: 1,
      xp: 0,
      avatar: insertUser.avatar || null,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values()).filter(
      (progress) => progress.userId === userId
    );
  }

  async getUserProgressBySubject(userId: string, subject: string): Promise<UserProgress | undefined> {
    return Array.from(this.userProgress.values()).find(
      (progress) => progress.userId === userId && progress.subject === subject
    );
  }

  async createOrUpdateUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const existing = await this.getUserProgressBySubject(insertProgress.userId, insertProgress.subject);
    
    if (existing) {
      const updated = { ...existing, ...insertProgress, lastActivity: new Date() };
      this.userProgress.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const progress: UserProgress = { 
        ...insertProgress, 
        id, 
        level: insertProgress.level || 1,
        progress: insertProgress.progress || 0,
        lastActivity: new Date() 
      };
      this.userProgress.set(id, progress);
      return progress;
    }
  }

  async getUserMoodEntries(userId: string, limit = 10): Promise<MoodEntry[]> {
    return Array.from(this.moodEntries.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
  }

  async createMoodEntry(insertMoodEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = randomUUID();
    const moodEntry: MoodEntry = { 
      ...insertMoodEntry, 
      id, 
      timestamp: new Date() 
    };
    this.moodEntries.set(id, moodEntry);
    return moodEntry;
  }

  async getUserGameScores(userId: string, gameId?: string): Promise<GameScore[]> {
    return Array.from(this.gameScores.values())
      .filter((score) => score.userId === userId && (!gameId || score.gameId === gameId))
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
  }

  async createGameScore(insertGameScore: InsertGameScore): Promise<GameScore> {
    const id = randomUUID();
    const gameScore: GameScore = { 
      ...insertGameScore, 
      id, 
      completedAt: new Date() 
    };
    this.gameScores.set(id, gameScore);
    return gameScore;
  }
}

export const storage = new MemStorage();
