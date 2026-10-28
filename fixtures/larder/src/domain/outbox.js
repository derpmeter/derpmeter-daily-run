// The notification outbox: messages waiting to be sent by an outside worker.
// Each message has a `key`; enqueueing a key that is already there does
// nothing, so jobs can run twice safely.

/** Adds a message unless one with the same key exists; returns the message. */
export function enqueue(store, { key, kind, to, subject, body }, { at }) {
  store.data.outbox ??= [];
  const existing = store.data.outbox.find((m) => m.key === key);
  if (existing) return existing;
  const message = { id: store.nextId("message"), key, kind, to, subject, body, createdAt: at, sentAt: null };
  store.data.outbox.push(message);
  return message;
}

/** Messages not sent yet, oldest first. */
export function pending(store) {
  return (store.data.outbox ?? []).filter((m) => !m.sentAt).sort((a, b) => a.id - b.id);
}

/** Marks a message sent. */
export function markSent(store, id, { at }) {
  const m = (store.data.outbox ?? []).find((x) => x.id === id);
  if (m && !m.sentAt) m.sentAt = at;
  return m ?? null;
}
