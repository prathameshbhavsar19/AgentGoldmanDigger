import path from "path";
import { cfg } from "../config.js";

/**
 * Resolve a file path within a user's data folder.
 * Throws if the result would escape USERS_DIR (traversal guard).
 */
export function userFile(uid: string, filename: string): string {
  const usersDir = path.resolve(cfg.USERS_DIR);
  const target = path.resolve(usersDir, uid, filename);
  if (!target.startsWith(usersDir + path.sep) && target !== usersDir) {
    throw new Error(`Path traversal blocked: ${target}`);
  }
  return target;
}

export function userDir(uid: string): string {
  const usersDir = path.resolve(cfg.USERS_DIR);
  const dir = path.resolve(usersDir, uid);
  if (!dir.startsWith(usersDir + path.sep) && dir !== usersDir) {
    throw new Error(`Path traversal blocked: ${dir}`);
  }
  return dir;
}
