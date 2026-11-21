import { CanceledError } from 'axios';
import { deleteCalendarEvent } from '../api/calendar';
import { deleteChecklistItem, toggleChecklistItem } from '../api/checklist';
import {
  assertCurrentSession,
  getSessionVersion,
  isCurrentSession,
  subscribeSession,
} from '../utils/authSession';
import { invalidateResources, queryClient } from './client';

type Row = Record<string, unknown>;
type Change = { next?: boolean; previous: boolean; pending: boolean; sequence: number };
let sequence = 0;
const changes = new Map<string, Change>();
const locks = new Map<string, { next?: boolean; promise: Promise<void> }>();
const deletionOrders = new Map<string, unknown>();
let currentVersion = getSessionVersion();
subscribeSession(() => {
  if (getSessionVersion() === currentVersion) return;
  currentVersion = getSessionVersion();
  changes.clear();
  locks.clear();
  deletionOrders.clear();
});
const domains = ['calendar', 'newsletterChecklist', 'today', 'markers'];
const rowKey = (version: number, kind: string, id: number) => `${version}:${kind}:${id}`;
export const getChangeSequence = () => sequence;

const visit = (value: unknown, transform: (row: Row) => Row | null): unknown => {
  if (Array.isArray(value))
    return value.map((item) => visit(item, transform)).filter((item) => item !== null);
  if (!value || typeof value !== 'object') return value;
  const row = transform(value as Row);
  if (!row) return null;
  return Object.fromEntries(
    Object.entries(row).map(([key, child]) => [key, visit(child, transform)])
  );
};

export const applyResourceChanges = <T>(data: T, version: number, started: number): T =>
  visit(data, (row) => {
    const event =
      typeof row.eventId === 'number'
        ? changes.get(rowKey(version, 'event', row.eventId))
        : undefined;
    if (event && (event.pending || event.sequence > started)) return null;
    if (typeof row.checklistId !== 'number') return row;
    const change = changes.get(rowKey(version, 'checklist', row.checklistId));
    if (!change || (!change.pending && change.sequence <= started)) return row;
    if (change.pending && typeof row.isCompleted === 'boolean') change.previous = row.isCompleted;
    if (change.next === undefined) return null;
    return { ...row, isCompleted: change.next };
  }) as T;

const restoreRow = (current: unknown, original: unknown, id: number, order = original): unknown => {
  if (Array.isArray(current) && Array.isArray(original)) {
    let next = current.map((item, itemIndex) => {
      const identity = ['checklistId', 'eventId', 'date'].find(
        (key) => (item as Row)?.[key] !== undefined
      );
      const match = identity
        ? original.find((row) => (row as Row)?.[identity] === (item as Row)?.[identity])
        : original[itemIndex];
      let orderMatch: unknown;
      if (Array.isArray(order))
        orderMatch = identity
          ? order.find((row) => (row as Row)?.[identity] === (item as Row)?.[identity])
          : order[itemIndex];
      return restoreRow(item, match, id, orderMatch);
    });
    const index = original.findIndex((row) => (row as Row)?.checklistId === id);
    if (index >= 0 && !next.some((row) => (row as Row)?.checklistId === id)) {
      const ordered = Array.isArray(order) ? order : original;
      const orderIndex = ordered.findIndex((row) => (row as Row)?.checklistId === id);
      const later = new Set(ordered.slice(orderIndex + 1).map((row) => (row as Row)?.checklistId));
      const insertion = next.findIndex((row) => later.has((row as Row)?.checklistId));
      next = [
        ...next.slice(0, insertion < 0 ? next.length : insertion),
        original[index],
        ...next.slice(insertion < 0 ? next.length : insertion),
      ];
    }
    return next;
  }
  if (current && original && typeof current === 'object' && typeof original === 'object') {
    return Object.fromEntries(
      Object.entries(current).map(([key, value]) => [
        key,
        restoreRow(value, (original as Row)[key], id, (order as Row | undefined)?.[key]),
      ])
    );
  }
  return current;
};

export const changeChecklist = (id: number, previous: boolean, next?: boolean): Promise<void> => {
  const version = getSessionVersion();
  const key = rowKey(version, 'checklist', id);
  const pending = locks.get(key);
  if (pending) {
    if (pending.next === next) return pending.promise;
    if (pending.next === undefined)
      return Promise.reject(new CanceledError('Checklist deletion in progress'));
    return pending.promise
      .catch(() => {})
      .then(() => {
        assertCurrentSession(version);
        return changeChecklist(id, previous, next);
      });
  }
  const operation = (async () => {
    const change: Change = { next, previous, pending: true, sequence: (sequence += 1) };
    changes.set(key, change);
    await queryClient.cancelQueries({
      predicate: (query) =>
        query.queryKey[1] === version && domains.includes(String(query.queryKey[3])),
    });
    assertCurrentSession(version);
    const originals = queryClient.getQueriesData({
      predicate: (query) =>
        query.queryKey[1] === version && domains.includes(String(query.queryKey[3])),
    });
    if (next === undefined)
      originals.forEach(([queryKey, data]) => {
        const hash = JSON.stringify(queryKey);
        if (!deletionOrders.has(hash)) deletionOrders.set(hash, data);
      });
    originals.forEach(([queryKey, data]) =>
      queryClient.setQueryData(
        queryKey,
        visit(data, (row) => {
          if (row.checklistId !== id) return row;
          return next === undefined ? null : { ...row, isCompleted: next };
        })
      )
    );
    try {
      if (next === undefined) await deleteChecklistItem(id);
      else await toggleChecklistItem(id, next);
      assertCurrentSession(version);
      change.pending = false;
      sequence += 1;
      change.sequence = sequence;
    } catch (error) {
      changes.delete(key);
      if (isCurrentSession(version)) {
        if (next === undefined) {
          originals.forEach(([queryKey, original]) => {
            queryClient.setQueryData(queryKey, (current: unknown) =>
              restoreRow(current, original, id, deletionOrders.get(JSON.stringify(queryKey)))
            );
          });
        } else {
          queryClient.setQueriesData(
            {
              predicate: (query) =>
                query.queryKey[1] === version && domains.includes(String(query.queryKey[3])),
            },
            (current: unknown) =>
              visit(current, (row) =>
                row.checklistId === id ? { ...row, isCompleted: change.previous } : row
              )
          );
        }
      }
      throw error;
    }
  })().finally(() => {
    locks.delete(key);
    if (isCurrentSession(version)) {
      if (![...locks.values()].some((lock) => lock.next === undefined)) deletionOrders.clear();
      void invalidateResources(domains, version);
    }
  });
  locks.set(key, { next, promise: operation });
  return operation;
};

export const removeCalendarEvent = async (id: number) => {
  const version = getSessionVersion();
  await deleteCalendarEvent(id);
  assertCurrentSession(version);
  changes.set(rowKey(version, 'event', id), {
    previous: false,
    pending: false,
    sequence: (sequence += 1),
  });
  queryClient.setQueriesData(
    {
      predicate: (query) =>
        query.queryKey[1] === version && domains.includes(String(query.queryKey[3])),
    },
    (data: unknown) => visit(data, (row) => (row.eventId === id ? null : row))
  );
  await invalidateResources(['markers', 'newsletters', 'recent'], version);
};
