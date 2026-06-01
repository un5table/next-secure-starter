// Global test setup. Keep this lean — module mocks (prisma, auth, email) belong
// in the individual test files via vi.mock so they hoist correctly.
// Vitest already sets NODE_ENV=test.
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
