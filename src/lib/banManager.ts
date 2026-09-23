/**
 * Centralized Ban Engine and Room Freeze Sentinel for Cash Stage
 */

export interface BanState {
  isBanned: boolean;
  reason?: string;
  expiresAt?: string | null; // null for permanent
}

export interface RoomFreezeState {
  isFrozen: boolean;
  frozenBy?: string;
  reason?: string;
}

class UserBanManager {
  private bannedUsers: Map<string, BanState> = new Map();
  private frozenRooms: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Initial mock bans/mutes if needed or sync from server
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public isUserBanned(userId: string): boolean {
    const ban = this.bannedUsers.get(userId);
    if (!ban) return false;
    if (ban.expiresAt) {
      if (new Date(ban.expiresAt).getTime() < Date.now()) {
        this.bannedUsers.delete(userId);
        return false;
      }
    }
    return ban.isBanned;
  }

  public getBanInfo(userId: string): BanState | undefined {
    return this.bannedUsers.get(userId);
  }

  public banUser(userId: string, duration: '24h' | '1m' | 'perm', reason: string) {
    let expiresAt: string | null = null;
    if (duration === '24h') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else if (duration === '1m') {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    this.bannedUsers.set(userId, {
      isBanned: true,
      reason,
      expiresAt,
    });
    this.notify();
  }

  public unbanUser(userId: string) {
    this.bannedUsers.delete(userId);
    this.notify();
  }

  public isRoomFrozen(roomId: string): boolean {
    return this.frozenRooms.has(roomId);
  }

  public setRoomFrozen(roomId: string, frozen: boolean) {
    if (frozen) {
      this.frozenRooms.add(roomId);
    } else {
      this.frozenRooms.delete(roomId);
    }
    this.notify();
  }

  // Guard checks
  public assertCanMessage(userId: string, roomId?: string): { allowed: boolean; error?: string } {
    if (this.isUserBanned(userId)) {
      return { allowed: false, error: 'Account suspended by AI Sentinel. Messaging blocked.' };
    }
    if (roomId && this.isRoomFrozen(roomId)) {
      return { allowed: false, error: 'Room currently frozen by AI Patrol. Commentary paused.' };
    }
    return { allowed: true };
  }

  public assertCanVote(userId: string): { allowed: boolean; error?: string } {
    if (this.isUserBanned(userId)) {
      return { allowed: false, error: 'Account suspended. Voting blocked.' };
    }
    return { allowed: true };
  }

  public assertCanRecord(userId: string): { allowed: boolean; error?: string } {
    if (this.isUserBanned(userId)) {
      return { allowed: false, error: 'Account suspended. Vocal recording & stem rendering restricted.' };
    }
    return { allowed: true };
  }
}

export const banManager = new UserBanManager();
