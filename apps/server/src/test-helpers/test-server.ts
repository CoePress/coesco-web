import type { Application } from "express";

import request from "supertest";

export class TestServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  get(url: string) {
    return request(this.app).get(url);
  }

  post(url: string) {
    return request(this.app).post(url);
  }

  put(url: string) {
    return request(this.app).put(url);
  }

  patch(url: string) {
    return request(this.app).patch(url);
  }

  delete(url: string) {
    return request(this.app).delete(url);
  }

  withAuth(token: string) {
    return {
      get: (url: string) => request(this.app).get(url).set("Authorization", `Bearer ${token}`),
      post: (url: string) => request(this.app).post(url).set("Authorization", `Bearer ${token}`),
      put: (url: string) => request(this.app).put(url).set("Authorization", `Bearer ${token}`),
      patch: (url: string) => request(this.app).patch(url).set("Authorization", `Bearer ${token}`),
      delete: (url: string) => request(this.app).delete(url).set("Authorization", `Bearer ${token}`),
    };
  }
}

export function createTestServer(app: Application): TestServer {
  return new TestServer(app);
}
