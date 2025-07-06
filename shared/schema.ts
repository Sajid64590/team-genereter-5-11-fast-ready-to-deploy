
import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gameData = pgTable("game_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  redPlayers: jsonb("red_players").$type<string[]>().notNull(),
  blackPlayers: jsonb("black_players").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  gameDataId: integer("game_data_id").references(() => gameData.id).notNull(),
  teamNumber: integer("team_number").notNull(),
  players: jsonb("players").$type<string[]>().notNull(),
  redCount: integer("red_count").notNull(),
  blackCount: integer("black_count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  gameData: many(gameData),
}));

export const gameDataRelations = relations(gameData, ({ one, many }) => ({
  user: one(users, {
    fields: [gameData.userId],
    references: [users.id],
  }),
  teams: many(teams),
}));

export const teamsRelations = relations(teams, ({ one }) => ({
  gameData: one(gameData, {
    fields: [teams.gameDataId],
    references: [gameData.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createInsertSchema(users);
export const insertGameDataSchema = createInsertSchema(gameData);
export const selectGameDataSchema = createInsertSchema(gameData);
export const insertTeamSchema = createInsertSchema(teams);
export const selectTeamSchema = createInsertSchema(teams);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type GameData = typeof gameData.$inferSelect;
export type NewGameData = typeof gameData.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
