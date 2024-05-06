import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";

export type Bindings = {
  BUCKET_TFSTATE: R2Bucket;
  KV_TFSTATE: KVNamespace;

  TF_HTTP_USERNAME: string;
  TF_HTTP_PASSWORD: string;
  BUCKET_PATH_PREFIX: string | undefined;
};

export type HonoEnv = {
  Bindings: Bindings;
};

const app = new Hono<HonoEnv>();

app.use((c, next) => {
  const {
    env: { TF_HTTP_USERNAME: username, TF_HTTP_PASSWORD: password },
  } = c;

  return basicAuth({ username, password })(c, next);
});

app.on(["GET", "POST", "DELETE", "LOCK", "UNLOCK"], "/:path{.*}", async (c) => {
  const { req, env } = c;
  const { method, path } = req;

  switch (method) {
    // There is no concept of ownership in this locking mechanism,
    // so you shouldn't block access to a locked file.  Otherwise,
    // even the lock acquirer is unable to use the file.

    case "GET": {
      const { BUCKET_PATH_PREFIX = "", BUCKET_TFSTATE } = env;
      const objectPath = `${BUCKET_PATH_PREFIX}${path}`;
      const object = await BUCKET_TFSTATE.get(objectPath);
      if (object === null) return c.body(null, 404);

      object.writeHttpMetadata(c.res.headers);
      return c.body(object.body);
    }

    case "PUT":
    case "POST": {
      const { BUCKET_PATH_PREFIX = "", BUCKET_TFSTATE } = env;
      const objectPath = `${BUCKET_PATH_PREFIX}${path}`;
      await BUCKET_TFSTATE.put(objectPath, JSON.stringify(await req.json()), {
        httpMetadata: { contentType: "application/json" },
      });
      return c.body(null, 200);
    }

    case "DELETE": {
      const { BUCKET_PATH_PREFIX = "", BUCKET_TFSTATE } = env;
      const objectPath = `${BUCKET_PATH_PREFIX}${path}`;
      await BUCKET_TFSTATE.delete(objectPath);
      return c.body(null, 204);
    }

    case "LOCK": {
      const { KV_TFSTATE } = env;
      const key = `lock:${path}`;
      const lock = await KV_TFSTATE.get(key);
      if (lock !== null) return c.body(null, 423);

      const text = await req.text();
      await KV_TFSTATE.put(key, text);
      return c.body(null, 200);
    }

    case "UNLOCK": {
      const { KV_TFSTATE } = env;
      const key = `lock:${path}`;
      const lock = await KV_TFSTATE.delete(key);
      return c.body(null, 200);
    }
  }

  return c.body(null, 400);
});

export default app;
