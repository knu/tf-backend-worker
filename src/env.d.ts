declare module "cloudflare:test" {
  interface ProvidedEnv {
    KV_TFSTATE: KVNamespace;
    BUCKET_TFSTATE: R2Bucket;
  }

  interface ProvidedEnv extends Env {}
}
