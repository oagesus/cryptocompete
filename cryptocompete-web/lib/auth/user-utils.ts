import { User } from "./get-user";

export const isPremium = (user: User) =>
  user.roles.includes("Premium");

export const isAdmin = (user: User) =>
  user.roles.includes("Admin");