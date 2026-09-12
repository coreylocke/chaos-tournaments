import type { Guild, Role } from "discord.js";

/**
 * Tournament roles managed by the bot (Section 49 of the master brief — scoped to the subset
 * that maps to features that actually exist today; the full role list in the brief also
 * includes roles for features not yet built, like "Fully Funded" and "Checked In", which
 * aren't wired up here).
 */
export const MANAGED_ROLES = {
  teamCaptain: { name: "Team Captain", color: 0xf1c40f },
  starter: { name: "Starter", color: 0x3498db },
  registered: { name: "Registered", color: 0x2ecc71 },
  tournamentWinner: { name: "Tournament Winner", color: 0xffd700 },
  tournamentRunnerUp: { name: "Tournament Runner-Up", color: 0xc0c0c0 },
} as const;

export type ManagedRoleKey = keyof typeof MANAGED_ROLES;

const roleCache = new Map<string, Role>();

/**
 * Finds a managed role by name in the guild, creating it (with a fixed color, not mentionable,
 * not hoisted) if it doesn't exist yet. Caches the result in-memory per process lifetime —
 * fine since role churn is low and the bot restarts pick up fresh state anyway.
 */
async function getOrCreateRole(guild: Guild, key: ManagedRoleKey): Promise<Role> {
  const cached = roleCache.get(key);
  if (cached) return cached;

  const config = MANAGED_ROLES[key];
  await guild.roles.fetch(); // ensure cache is populated before searching
  let role = guild.roles.cache.find((r) => r.name === config.name);

  if (!role) {
    role = await guild.roles.create({
      name: config.name,
      color: config.color,
      hoist: false,
      mentionable: false,
      reason: "Auto-created by Chaos Tournaments bot for role automation.",
    });
    console.log(`[roles] created missing role "${config.name}"`);
  }

  roleCache.set(key, role);
  return role;
}

/** Assigns a managed role to a Discord user by their user ID. No-ops if the member isn't in the guild. */
export async function assignRole(guild: Guild, discordUserId: string, key: ManagedRoleKey): Promise<void> {
  try {
    const role = await getOrCreateRole(guild, key);
    const member = await guild.members.fetch(discordUserId).catch(() => null);
    if (!member) {
      console.warn(`[roles] member ${discordUserId} not found in guild, skipping role assign`);
      return;
    }
    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role);
    }
  } catch (err) {
    console.error(`[roles] failed to assign ${key} to ${discordUserId}:`, err);
  }
}

/** Removes a managed role from a Discord user by their user ID. No-ops if the member isn't in the guild. */
export async function removeRole(guild: Guild, discordUserId: string, key: ManagedRoleKey): Promise<void> {
  try {
    const role = await getOrCreateRole(guild, key);
    const member = await guild.members.fetch(discordUserId).catch(() => null);
    if (!member) return;
    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
    }
  } catch (err) {
    console.error(`[roles] failed to remove ${key} from ${discordUserId}:`, err);
  }
}
