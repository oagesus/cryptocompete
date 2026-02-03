import { User } from "./get-user";

export const isPremium = (user: User) =>
  user.roles.includes("Premium") || user.roles.includes("Admin");

export const isAdmin = (user: User) =>
  user.roles.includes("Admin");