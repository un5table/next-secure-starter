import argon2 from "argon2";

// argon2id with library defaults — strong memory-hard hashing.
export const hashPassword = (password: string) => argon2.hash(password);
export const verifyPassword = (hash: string, password: string) =>
  argon2.verify(hash, password);
