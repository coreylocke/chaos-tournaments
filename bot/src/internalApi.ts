import http from "node:http";
import type { Client } from "discord.js";
import { env } from "./env.js";
import {
  handleTeamCreated,
  handleRosterMemberAdded,
  handleRegistrationApproved,
  handleTournamentCompleted,
} from "./roleSync.js";

type RoleSyncBody =
  | { event: "team_created"; teamId: string }
  | { event: "roster_member_added"; userId: string; rosterRole: string }
  | { event: "registration_approved"; teamId: string }
  | { event: "tournament_completed"; winnerTeamId: string; runnerUpTeamId: string | null };

/**
 * Small internal-only HTTP server the Next.js app calls (over the Docker network, never
 * exposed to the host) right after a mutation that should trigger role automation — same
 * "hands-off for owner" pattern as the existing Discord webhook notifications, just for role
 * sync instead of channel messages. Auth is a shared secret header, not OAuth — this only
 * needs to be reachable from inside the compose network.
 */
export function startInternalApi(client: Client) {
  const server = http.createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/internal/role-sync") {
      res.writeHead(404).end();
      return;
    }
    if (req.headers["x-bot-secret"] !== env.botInternalSecret) {
      res.writeHead(401).end();
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body) as RoleSyncBody;
        const guild = await client.guilds.fetch(env.discordGuildId);

        switch (payload.event) {
          case "team_created":
            await handleTeamCreated(guild, payload.teamId);
            break;
          case "roster_member_added":
            await handleRosterMemberAdded(guild, payload.userId, payload.rosterRole);
            break;
          case "registration_approved":
            await handleRegistrationApproved(guild, payload.teamId);
            break;
          case "tournament_completed":
            await handleTournamentCompleted(guild, payload.winnerTeamId, payload.runnerUpTeamId);
            break;
          default:
            res.writeHead(400).end("Unknown event");
            return;
        }

        res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error("[internal-api] role-sync failed:", err);
        res.writeHead(500).end("Internal error");
      }
    });
  });

  server.listen(env.botInternalPort, () => {
    console.log(`[internal-api] listening on :${env.botInternalPort}`);
  });
}
