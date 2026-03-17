import { describe, expect, it } from "vitest";
import { SELF } from "cloudflare:test";

describe("worker", () => {
  const authHeaders = (username: string, password: string) => {
    return {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    };
  };
  const defaultHeaders = authHeaders("user", "pass");
  const doRequest = (
    method: string,
    url: string,
    options: RequestInit = {},
  ) => {
    const req = new Request(url, {
      method,
      headers: defaultHeaders,
      ...options,
    });
    return SELF.fetch(req);
  };

  describe("authorization", () => {
    describe("without authorization", () => {
      it("returns 401", async () => {
        const res = await doRequest("GET", "http://localhost/foo", {
          headers: {},
        });

        expect(res.status).toBe(401);
      });
    });

    describe("with wrong authorization", () => {
      it("returns 401", async () => {
        const res = await doRequest("GET", "http://localhost/foo", {
          headers: authHeaders("wronguser", "wrongpassword"),
        });

        expect(res.status).toBe(401);
      });
    });

    describe("with correct authorization", () => {
      it("returns a non-401 response", async () => {
        const res = await doRequest("GET", "http://localhost/foo");

        expect(res.status).toBe(404);
      });
    });
  });

  describe("locking", () => {
    it("works", async () => {
      let res;

      res = await doRequest("LOCK", "http://localhost/foo");
      expect(res.ok).toBe(true);

      res = await doRequest("LOCK", "http://localhost/foo");
      expect(res.ok).toBe(false);
      expect(res.status).toBe(423);

      res = await doRequest("UNLOCK", "http://localhost/foo");
      expect(res.ok).toBe(true);

      res = await doRequest("UNLOCK", "http://localhost/foo");
      expect(res.ok).toBe(true);
    });
  });

  describe("CRUD", () => {
    it("works", async () => {
      let res;
      const data = { foo: "bar" };

      res = await doRequest("LOCK", "http://localhost/foo");
      expect(res.ok).toBe(true);

      res = await doRequest("POST", "http://localhost/foo", {
        body: JSON.stringify(data),
      });

      res = await doRequest("GET", "http://localhost/foo");
      expect(res.ok).toBe(true);
      expect(await res.json()).toEqual(data);

      res = await doRequest("UNLOCK", "http://localhost/foo");
      expect(res.ok).toBe(true);

      res = await doRequest("DELETE", "http://localhost/foo");
      expect(res.ok).toBe(true);

      res = await doRequest("GET", "http://localhost/foo");
      expect(res.status).toBe(404);
    });
  });
});
