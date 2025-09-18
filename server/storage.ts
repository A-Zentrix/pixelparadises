import { type User, type InsertUser, type UserProgress, type InsertUserProgress, type MoodEntry, type InsertMoodEntry, type GameScore, type InsertGameScore, type Movie, type InsertMovie, type Video, type InsertVideo, type Song, type InsertSong, type CoinTransaction, type InsertCoinTransaction, type Reward, type InsertReward, type UserReward, type InsertUserReward } from "@shared/schema";
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

  // Movie methods
  getMovies(category?: string): Promise<Movie[]>;
  getMovie(id: string): Promise<Movie | undefined>;
  createMovie(movie: InsertMovie): Promise<Movie>;
  updateMovie(id: string, updates: Partial<Movie>): Promise<Movie | undefined>;
  deleteMovie(id: string): Promise<boolean>;

  // Video methods
  getVideos(category?: string): Promise<Video[]>;
  getVideo(id: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined>;
  deleteVideo(id: string): Promise<boolean>;

  // Song methods
  getSongs(category?: string): Promise<Song[]>;
  getSong(id: string): Promise<Song | undefined>;
  createSong(song: InsertSong): Promise<Song>;
  updateSong(id: string, updates: Partial<Song>): Promise<Song | undefined>;
  deleteSong(id: string): Promise<boolean>;

  // Coin transaction methods
  getUserCoinTransactions(userId: string, limit?: number): Promise<CoinTransaction[]>;
  createCoinTransaction(transaction: InsertCoinTransaction): Promise<CoinTransaction>;
  earnCoins(userId: string, amount: number, source: string, sourceId?: string, description?: string): Promise<CoinTransaction>;
  spendCoins(userId: string, amount: number, source: string, sourceId?: string, description?: string): Promise<CoinTransaction | null>;

  // Reward methods
  getRewards(category?: string, isAvailable?: boolean): Promise<Reward[]>;
  getReward(id: string): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: string, updates: Partial<Reward>): Promise<Reward | undefined>;

  // User reward methods
  getUserRewards(userId: string): Promise<UserReward[]>;
  getUserReward(userId: string, rewardId: string): Promise<UserReward | undefined>;
  redeemReward(userId: string, rewardId: string): Promise<UserReward | null>;
  markRewardAsUsed(id: string): Promise<UserReward | undefined>;

  // Search methods
  searchContent(query: string, category?: string, limit?: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private userProgress: Map<string, UserProgress>;
  private moodEntries: Map<string, MoodEntry>;
  private gameScores: Map<string, GameScore>;
  private movies: Map<string, Movie>;
  private videos: Map<string, Video>;
  private songs: Map<string, Song>;
  private coinTransactions: Map<string, CoinTransaction>;
  private rewards: Map<string, Reward>;
  private userRewards: Map<string, UserReward>;

  constructor() {
    this.users = new Map();
    this.userProgress = new Map();
    this.moodEntries = new Map();
    this.gameScores = new Map();
    this.movies = new Map();
    this.videos = new Map();
    this.songs = new Map();
    this.coinTransactions = new Map();
    this.rewards = new Map();
    this.userRewards = new Map();

    // Create default user
    const defaultUser: User = {
      id: "user-1",
      username: "AstroBeth",
      email: "astrobeth@edumind.com",
      level: 7,
      xp: 2450,
      coins: 25,
      streakDays: 5,
      lastActivity: new Date(),
      achievements: ["first_login", "mood_tracker", "study_streak"],
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

    // Add sample movies
    const sampleMovies: Movie[] = [
      {
        id: "movie-1",
        title: "Focus Meditation Journey",
        description: "A guided meditation experience to enhance concentration and mindfulness",
        genre: "Educational, Wellness",
        year: 2024,
        rating: 4.8,
        posterUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&w=400",
        backdropUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&w=800",
        cast: ["Dr. Sarah Wilson", "Mark Thompson"],
        director: "Lisa Chen",
        duration: "15 min",
        category: "wellness",
        createdAt: new Date(),
      },
      {
        id: "movie-2", 
        title: "Mathematics Made Simple",
        description: "Interactive learning approach to mastering basic mathematics concepts",
        genre: "Educational",
        year: 2024,
        rating: 4.5,
        posterUrl: "https://images.unsplash.com/photo-1453396450673-3fe83d2db2c4?ixlib=rb-4.0.3&w=400",
        backdropUrl: "https://images.unsplash.com/photo-1453396450673-3fe83d2db2c4?ixlib=rb-4.0.3&w=800",
        cast: ["Prof. Ahmed Khan"],
        director: "Educational Team",
        duration: "25 min",
        category: "education",
        createdAt: new Date(),
      },
    ];
    sampleMovies.forEach(movie => this.movies.set(movie.id, movie));

    // Add sample videos
    const sampleVideos: Video[] = [
      {
        id: "video-1",
        title: "Morning Yoga Flow",
        description: "Start your day with this energizing 10-minute yoga routine",
        category: "yoga",
        duration: "10:00",
        posterUrl: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?ixlib=rb-4.0.3&w=400",
        videoUrl: "/videos/morning-yoga.mp4",
        userId: "user-1",
        createdAt: new Date(),
      },
      {
        id: "video-2",
        title: "Breathing Techniques for Focus",
        description: "Learn powerful breathing exercises to improve concentration",
        category: "meditation",
        duration: "8:00", 
        posterUrl: "https://images.unsplash.com/photo-1540479859555-17af45c78602?ixlib=rb-4.0.3&w=400",
        videoUrl: "/videos/breathing-focus.mp4",
        userId: "user-1",
        createdAt: new Date(),
      },
    ];
    sampleVideos.forEach(video => this.videos.set(video.id, video));

    // Add sample songs
    const sampleSongs: Song[] = [
      {
        id: "song-1",
        title: "Calm Ocean Waves",
        description: "Soothing ocean sounds for relaxation and sleep",
        category: "Audio",
        duration: "30:00",
        posterUrl: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&w=400",
        audioUrl: "/audio/ocean-waves.mp3",
        userId: null,
        createdAt: new Date(),
      },
      {
        id: "song-2",
        title: "Forest Meditation Music",
        description: "Peaceful forest sounds with gentle music for meditation",
        category: "Audio",
        duration: "20:00",
        posterUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&w=400", 
        audioUrl: "/audio/forest-meditation.mp3",
        userId: null,
        createdAt: new Date(),
      },
    ];
    sampleSongs.forEach(song => this.songs.set(song.id, song));

    // Add sample rewards
    const sampleRewards: Reward[] = [
      {
        id: "reward-1",
        name: "Premium Meditation Pack",
        description: "Unlock 5 exclusive guided meditation sessions",
        cost: 10,
        category: "premium_content",
        type: "video",
        data: { videoIds: ["premium-med-1", "premium-med-2", "premium-med-3"] },
        isAvailable: true,
        createdAt: new Date(),
      },
      {
        id: "reward-2",
        name: "Zen Master Badge",
        description: "Show off your meditation mastery with this exclusive badge",
        cost: 15,
        category: "digital",
        type: "badge",
        data: { badgeName: "zen_master", icon: "🧘", rarity: "rare" },
        isAvailable: true,
        createdAt: new Date(),
      },
    ];
    sampleRewards.forEach(reward => this.rewards.set(reward.id, reward));
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
      email: insertUser.email || null,
      level: insertUser.level || 1,
      xp: insertUser.xp || 0,
      coins: insertUser.coins || 0,
      streakDays: insertUser.streakDays || 0,
      lastActivity: new Date(),
      achievements: insertUser.achievements || [],
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

  // Movie methods
  async getMovies(category?: string): Promise<Movie[]> {
    const allMovies = Array.from(this.movies.values());
    if (category) {
      return allMovies.filter(movie => movie.category === category);
    }
    return allMovies.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getMovie(id: string): Promise<Movie | undefined> {
    return this.movies.get(id);
  }

  async createMovie(insertMovie: InsertMovie): Promise<Movie> {
    const id = randomUUID();
    const movie: Movie = {
      ...insertMovie,
      id,
      createdAt: new Date(),
    };
    this.movies.set(id, movie);
    return movie;
  }

  async updateMovie(id: string, updates: Partial<Movie>): Promise<Movie | undefined> {
    const movie = this.movies.get(id);
    if (!movie) return undefined;
    
    const updatedMovie = { ...movie, ...updates };
    this.movies.set(id, updatedMovie);
    return updatedMovie;
  }

  async deleteMovie(id: string): Promise<boolean> {
    return this.movies.delete(id);
  }

  // Video methods
  async getVideos(category?: string): Promise<Video[]> {
    const allVideos = Array.from(this.videos.values());
    if (category) {
      return allVideos.filter(video => video.category === category);
    }
    return allVideos.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getVideo(id: string): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = randomUUID();
    const video: Video = {
      ...insertVideo,
      id,
      createdAt: new Date(),
    };
    this.videos.set(id, video);
    return video;
  }

  async updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined> {
    const video = this.videos.get(id);
    if (!video) return undefined;
    
    const updatedVideo = { ...video, ...updates };
    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }

  async deleteVideo(id: string): Promise<boolean> {
    return this.videos.delete(id);
  }

  // Song methods
  async getSongs(category?: string): Promise<Song[]> {
    const allSongs = Array.from(this.songs.values());
    if (category) {
      return allSongs.filter(song => song.category === category);
    }
    return allSongs.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getSong(id: string): Promise<Song | undefined> {
    return this.songs.get(id);
  }

  async createSong(insertSong: InsertSong): Promise<Song> {
    const id = randomUUID();
    const song: Song = {
      ...insertSong,
      id,
      createdAt: new Date(),
    };
    this.songs.set(id, song);
    return song;
  }

  async updateSong(id: string, updates: Partial<Song>): Promise<Song | undefined> {
    const song = this.songs.get(id);
    if (!song) return undefined;
    
    const updatedSong = { ...song, ...updates };
    this.songs.set(id, updatedSong);
    return updatedSong;
  }

  async deleteSong(id: string): Promise<boolean> {
    return this.songs.delete(id);
  }

  // Coin transaction methods
  async getUserCoinTransactions(userId: string, limit: number = 50): Promise<CoinTransaction[]> {
    return Array.from(this.coinTransactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
  }

  async createCoinTransaction(insertTransaction: InsertCoinTransaction): Promise<CoinTransaction> {
    const id = randomUUID();
    const transaction: CoinTransaction = {
      ...insertTransaction,
      id,
      timestamp: new Date(),
    };
    this.coinTransactions.set(id, transaction);
    return transaction;
  }

  async earnCoins(userId: string, amount: number, source: string, sourceId?: string, description?: string): Promise<CoinTransaction> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    // Update user's coin balance
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = { ...user, coins: user.coins + amount };
    this.users.set(userId, updatedUser);
    
    // Create transaction record
    const transaction = await this.createCoinTransaction({
      userId,
      amount,
      transactionType: 'earn',
      source,
      sourceId: sourceId || null,
      description: description || `Earned ${amount} coins from ${source}`,
    });
    
    return transaction;
  }

  async spendCoins(userId: string, amount: number, source: string, sourceId?: string, description?: string): Promise<CoinTransaction | null> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    // Check user's coin balance
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.coins < amount) {
      return null; // Insufficient funds
    }
    
    // Update user's coin balance
    const updatedUser = { ...user, coins: user.coins - amount };
    this.users.set(userId, updatedUser);
    
    // Create transaction record
    const transaction = await this.createCoinTransaction({
      userId,
      amount,
      transactionType: 'spend',
      source,
      sourceId: sourceId || null,
      description: description || `Spent ${amount} coins on ${source}`,
    });
    
    return transaction;
  }

  // Reward methods
  async getRewards(category?: string, isAvailable?: boolean): Promise<Reward[]> {
    let rewards = Array.from(this.rewards.values());
    
    if (category) {
      rewards = rewards.filter(reward => reward.category === category);
    }
    
    if (isAvailable !== undefined) {
      rewards = rewards.filter(reward => reward.isAvailable === isAvailable);
    }
    
    return rewards.sort((a, b) => a.cost - b.cost);
  }

  async getReward(id: string): Promise<Reward | undefined> {
    return this.rewards.get(id);
  }

  async createReward(insertReward: InsertReward): Promise<Reward> {
    const id = randomUUID();
    const reward: Reward = {
      ...insertReward,
      id,
      createdAt: new Date(),
    };
    this.rewards.set(id, reward);
    return reward;
  }

  async updateReward(id: string, updates: Partial<Reward>): Promise<Reward | undefined> {
    const reward = this.rewards.get(id);
    if (!reward) return undefined;
    
    const updatedReward = { ...reward, ...updates };
    this.rewards.set(id, updatedReward);
    return updatedReward;
  }

  // User reward methods
  async getUserRewards(userId: string): Promise<UserReward[]> {
    return Array.from(this.userRewards.values())
      .filter(userReward => userReward.userId === userId)
      .sort((a, b) => b.redeemedAt!.getTime() - a.redeemedAt!.getTime());
  }

  async getUserReward(userId: string, rewardId: string): Promise<UserReward | undefined> {
    return Array.from(this.userRewards.values())
      .find(userReward => userReward.userId === userId && userReward.rewardId === rewardId);
  }

  async redeemReward(userId: string, rewardId: string): Promise<UserReward | null> {
    // Check if reward exists and is available
    const reward = await this.getReward(rewardId);
    if (!reward || !reward.isAvailable) {
      return null;
    }
    
    // Try to spend coins
    const transaction = await this.spendCoins(userId, reward.cost, 'reward', rewardId, `Redeemed ${reward.name}`);
    if (!transaction) {
      return null; // Insufficient funds
    }
    
    // Create user reward record
    const id = randomUUID();
    const userReward: UserReward = {
      id,
      userId,
      rewardId,
      isUsed: false,
      redeemedAt: new Date(),
      usedAt: null,
    };
    this.userRewards.set(id, userReward);
    return userReward;
  }

  async markRewardAsUsed(id: string): Promise<UserReward | undefined> {
    const userReward = this.userRewards.get(id);
    if (!userReward) return undefined;
    
    const updatedUserReward = { ...userReward, isUsed: true, usedAt: new Date() };
    this.userRewards.set(id, updatedUserReward);
    return updatedUserReward;
  }

  // Search methods
  async searchContent(query: string, category?: string, limit: number = 20): Promise<any[]> {
    const results: any[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Search movies
    const movies = Array.from(this.movies.values())
      .filter(movie => 
        (!category || movie.category === category) &&
        (movie.title.toLowerCase().includes(lowerQuery) || 
         (movie.description ?? "").toLowerCase().includes(lowerQuery) ||
         (movie.genre ?? "").toLowerCase().includes(lowerQuery))
      )
      .map(movie => ({ ...movie, type: 'movie' }));
    results.push(...movies);
    
    // Search videos
    const videos = Array.from(this.videos.values())
      .filter(video => 
        (!category || video.category === category) &&
        (video.title.toLowerCase().includes(lowerQuery) || 
         (video.description ?? "").toLowerCase().includes(lowerQuery))
      )
      .map(video => ({ ...video, type: 'video' }));
    results.push(...videos);
    
    // Search songs
    const songs = Array.from(this.songs.values())
      .filter(song => 
        (!category || song.category === category) &&
        (song.title.toLowerCase().includes(lowerQuery) || 
         (song.description ?? "").toLowerCase().includes(lowerQuery))
      )
      .map(song => ({ ...song, type: 'song' }));
    results.push(...songs);
    
    return results.slice(0, limit);
  }
}

export const storage = new MemStorage();
