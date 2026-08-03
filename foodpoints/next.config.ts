import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // FoodPoints ist eine eigenständige Sub-App im MDU-Repo.
  // Deployment als eigenes Vercel-Projekt mit Root-Directory "foodpoints".
  // Ohne explizite Root würde Turbopack das Repo-Root (Darts-App) mitbauen.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
