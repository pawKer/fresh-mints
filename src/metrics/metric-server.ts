import express from "express";
import core from "express";
import { Registry } from "prom-client";

export class MetricServer {
  port = 3000;
  server: core.Express;
  constructor(register: Registry) {
    this.server = express();
    this.server.get("/metrics", async (req: any, res: any) => {
      res.setHeader("Content-Type", register.contentType);
      res.send(await register.metrics());
    });
  }

  start(): void {
    this.server.listen(this.port, () => {
      console.log(`Started server for metrics listening on port ${this.port}`);
    });
  }
}
