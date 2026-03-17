import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: {
        bindings: {
          TF_HTTP_USERNAME: "user",
          TF_HTTP_PASSWORD: "pass",
        },
        kvNamespaces: ["KV_TFSTATE"],
        r2Buckets: ["BUCKET_TFSTATE"],
      },
      wrangler: { configPath: "./wrangler.example.toml" },
    }),
  ],
});
