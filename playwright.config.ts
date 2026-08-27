import { defineConfig, devices } from "@playwright/test";



const protectionBypass = process.env.VERCEL_PROTECTION_BYPASS;



export default defineConfig({
  
  testDir: "./tests/e2e",
  
  fullyParallel: true,
  
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }], ["list"]],
  
  use: {
    
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    
    extraHTTPHeaders: protectionBypass ? { "x-vercel-protection-bypass": protectionBypass } : undefined,
    
    trace: "retain-on-failure",
    
    screenshot: "only-on-failure",
    
  },
  
  projects: [
    
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    
    { name: "mobile", use: { ...devices["iPhone 13"] } },
    
  ],
  
});















