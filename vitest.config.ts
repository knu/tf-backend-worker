import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        miniflare: {
          bindings: {
            TF_HTTP_USERNAME: "user",
            TF_HTTP_PASSWORD: "pass",
          },
          kvNamespaces: ["KV_TFSTATE"],
          r2Buckets: ["BUCKET_TFSTATE"],
        },
        wrangler: { configPath: "./wrangler.example.toml" },
      },
    },
  },
});
