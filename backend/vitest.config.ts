import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/__tests__/**/*.test.ts'],
        globals: false,
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true
            }
        },
        coverage: {
            reporter: ['text', 'json-summary'],
            include: ['src/**/*.ts'],
            exclude: ['src/__tests__/**']
        }
    }
});