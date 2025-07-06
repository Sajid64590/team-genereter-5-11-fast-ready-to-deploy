import { users, gameData, teams, type User, type InsertUser, type GameDataType, type InsertGameData, type TeamType, type InsertTeam } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game data operations
  saveGameData(gameDataInput: InsertGameData): Promise<GameDataType>;
  getGameData(id: number): Promise<GameDataType | undefined>;
  getUserGameData(userId: number): Promise<GameDataType[]>;
  
  // Team operations
  saveTeams(teamsInput: InsertTeam[]): Promise<TeamType[]>;
  getTeamsByGameDataId(gameDataId: number): Promise<TeamType[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async saveGameData(gameDataInput: InsertGameData): Promise<GameDataType> {
    const [savedGameData] = await db
      .insert(gameData)
      .values(gameDataInput)
      .returning();
    return savedGameData;
  }

  async getGameData(id: number): Promise<GameDataType | undefined> {
    const [gameDataRecord] = await db.select().from(gameData).where(eq(gameData.id, id));
    return gameDataRecord || undefined;
  }

  async getUserGameData(userId: number): Promise<GameDataType[]> {
    return await db.select().from(gameData).where(eq(gameData.userId, userId));
  }

  async saveTeams(teamsInput: InsertTeam[]): Promise<TeamType[]> {
    if (teamsInput.length === 0) return [];
    
    const savedTeams = await db
      .insert(teams)
      .values(teamsInput)
      .returning();
    return savedTeams;
  }

  async getTeamsByGameDataId(gameDataId: number): Promise<TeamType[]> {
    return await db.select().from(teams).where(eq(teams.gameDataId, gameDataId));
  }
}

export const storage = new DatabaseStorage();
