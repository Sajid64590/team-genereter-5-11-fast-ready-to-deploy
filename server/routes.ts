import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameDataSchema, insertTeamSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test database connection
  app.get("/test-db", async (req, res) => {
    try {
      const result = await db.execute(sql`SELECT NOW()`);
      res.json({ 
        message: "Database connection successful", 
        timestamp: result.rows[0] 
      });
    } catch (error) {
      console.error("Database connection error:", error);
      res.status(500).json({ error: "Database connection failed" });
    }
  });

  // Save game data endpoint
  app.post("/api/game-data", async (req, res) => {
    try {
      const gameDataInput = insertGameDataSchema.parse(req.body);
      const savedGameData = await storage.saveGameData(gameDataInput);
      res.json(savedGameData);
    } catch (error) {
      console.error("Error saving game data:", error);
      res.status(400).json({ error: "Invalid game data" });
    }
  });

  // Get user's game data
  app.get("/api/game-data/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const gameData = await storage.getUserGameData(userId);
      res.json(gameData);
    } catch (error) {
      console.error("Error fetching game data:", error);
      res.status(500).json({ error: "Failed to fetch game data" });
    }
  });

  // Save teams endpoint
  app.post("/api/teams", async (req, res) => {
    try {
      const teamsInput = z.array(insertTeamSchema).parse(req.body);
      const savedTeams = await storage.saveTeams(teamsInput);
      res.json(savedTeams);
    } catch (error) {
      console.error("Error saving teams:", error);
      res.status(400).json({ error: "Invalid teams data" });
    }
  });

  // Get teams by game data ID
  app.get("/api/teams/:gameDataId", async (req, res) => {
    try {
      const gameDataId = parseInt(req.params.gameDataId);
      if (isNaN(gameDataId)) {
        return res.status(400).json({ error: "Invalid game data ID" });
      }
      
      const teams = await storage.getTeamsByGameDataId(gameDataId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
