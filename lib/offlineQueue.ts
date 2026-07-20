"use client";

type QueueBody = string | null;

export type OfflineQueueItem = {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: QueueBody;
  label: string;
  createdAt: string;
  attempts: number;
};

export type QueuedSubmitResult = {
  queued: boolean;
  response?: Response;
  data?: any;
};

const QUEUE_KEY = "agrivault.offline.queue.v1";
const CHANGE_EVENT = "agrivault-offline-queue-change";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readQueue(): OfflineQueueItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: OfflineQueueItem[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `queued-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getOfflineQueue() {
  return readQueue();
}

export function subscribeOfflineQueue(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("online", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("online", listener);
  };
}

export function queueOfflineRequest(url: string, init: RequestInit, label = "Farm record") {
  const headers = new Headers(init.headers);
  const item: OfflineQueueItem = {
    id: makeId(),
    url,
    method: init.method ?? "POST",
    headers: Object.fromEntries(headers.entries()),
    body: typeof init.body === "string" ? init.body : init.body ? String(init.body) : null,
    label,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  writeQueue([...readQueue(), item]);
  return item;
}

export async function submitWithOfflineQueue(
  url: string,
  init: RequestInit,
  label = "Farm record",
): Promise<QueuedSubmitResult> {
  const method = (init.method ?? "GET").toUpperCase();
  const queueable = method !== "GET" && method !== "DELETE";

  if (typeof navigator !== "undefined" && !navigator.onLine && queueable) {
    queueOfflineRequest(url, init, label);
    return { queued: true };
  }

  try {
    const response = await fetch(url, init);
    const text = await response.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text || response.statusText };
    }
    return { queued: false, response, data };
  } catch (error) {
    if (!queueable) throw error;
    queueOfflineRequest(url, init, label);
    return { queued: true };
  }
}

export async function flushOfflineQueue() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { synced: 0, failed: 0 };

  const items = readQueue();
  const remaining: OfflineQueueItem[] = [];
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      if (response.ok) {
        synced += 1;
      } else {
        failed += 1;
        remaining.push({ ...item, attempts: item.attempts + 1 });
      }
    } catch {
      failed += 1;
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  if (synced > 0 || failed > 0) writeQueue(remaining);
  return { synced, failed };
}
