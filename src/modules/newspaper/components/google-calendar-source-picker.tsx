"use client";

import { useState, useTransition } from "react";
import { CalendarClock, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  listGoogleCalendars,
  syncGoogleCalendars,
} from "@/modules/google-calendar/actions";
import type { GoogleCalendarSource } from "@/modules/newspaper/lib/types";

interface GoogleAccount {
  id: string;
  google_email: string;
}

interface CalendarRow {
  google_calendar_id: string;
  name: string;
  color: string | null;
}

interface Props {
  slug: string;
  sources: GoogleCalendarSource[];
  onChange: (sources: GoogleCalendarSource[]) => void;
  initialAccounts: GoogleAccount[];
}

export function GoogleCalendarSourcePicker({
  slug,
  sources,
  onChange,
  initialAccounts,
}: Props) {
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [calendarsByAccount, setCalendarsByAccount] = useState<
    Record<string, CalendarRow[]>
  >({});
  const [loadingAccount, setLoadingAccount] = useState<string | null>(null);
  const [syncingAccount, startSyncTransition] = useTransition();

  const totalSelected = sources.reduce((acc, s) => acc + s.calendar_ids.length, 0);

  function getSource(accountId: string): GoogleCalendarSource | undefined {
    return sources.find((s) => s.account_id === accountId);
  }

  function isAccountSelected(accountId: string) {
    return !!getSource(accountId);
  }

  function isCalendarSelected(accountId: string, calendarId: string) {
    return getSource(accountId)?.calendar_ids.includes(calendarId) ?? false;
  }

  async function loadCalendars(accountId: string) {
    if (calendarsByAccount[accountId]) return;
    setLoadingAccount(accountId);
    try {
      const cals = await listGoogleCalendars(slug, accountId);
      setCalendarsByAccount((prev) => ({ ...prev, [accountId]: cals }));
    } catch {
      setCalendarsByAccount((prev) => ({ ...prev, [accountId]: [] }));
    } finally {
      setLoadingAccount(null);
    }
  }

  function toggleExpand(accountId: string) {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
        loadCalendars(accountId);
      }
      return next;
    });
  }

  function toggleAccount(accountId: string) {
    if (isAccountSelected(accountId)) {
      onChange(sources.filter((s) => s.account_id !== accountId));
    } else {
      onChange([...sources, { account_id: accountId, calendar_ids: [] }]);
      // Auto-expand to show calendars
      setExpandedAccounts((prev) => {
        const next = new Set(prev);
        next.add(accountId);
        return next;
      });
      loadCalendars(accountId);
    }
  }

  function toggleCalendar(accountId: string, calendarId: string) {
    onChange(
      sources.map((s) => {
        if (s.account_id !== accountId) return s;
        const has = s.calendar_ids.includes(calendarId);
        return {
          ...s,
          calendar_ids: has
            ? s.calendar_ids.filter((id) => id !== calendarId)
            : [...s.calendar_ids, calendarId],
        };
      })
    );
  }

  function handleSync(accountId: string) {
    startSyncTransition(async () => {
      try {
        await syncGoogleCalendars(slug, accountId);
        // Reload calendar list after sync
        setCalendarsByAccount((prev) => {
          const next = { ...prev };
          delete next[accountId];
          return next;
        });
        await loadCalendars(accountId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to sync calendars");
      }
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarClock className="mr-2 h-4 w-4" />
          Google Calendars
          {totalSelected > 0 && (
            <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {totalSelected}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Google Calendar Sources</SheetTitle>
        </SheetHeader>

        <p className="text-xs text-muted-foreground pb-2">
          Select accounts and calendars to include in this template. Events are
          synced automatically when generating PDFs.
        </p>

        <div className="flex-1 overflow-y-auto space-y-2">
          {initialAccounts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No Google accounts connected.{" "}
              <a
                href={`/i/${slug}/settings`}
                className="underline underline-offset-2"
              >
                Connect one in Settings.
              </a>
            </p>
          )}

          {initialAccounts.map((account) => {
            const selected = isAccountSelected(account.id);
            const expanded = expandedAccounts.has(account.id);
            const calendars = calendarsByAccount[account.id] ?? [];
            const loading = loadingAccount === account.id;

            return (
              <div key={account.id} className="rounded-md border">
                {/* Account row */}
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleAccount(account.id)}
                    className="h-4 w-4 shrink-0"
                    id={`account-${account.id}`}
                  />
                  <label
                    htmlFor={`account-${account.id}`}
                    className="flex-1 text-sm font-medium cursor-pointer truncate"
                  >
                    {account.google_email}
                  </label>
                  {selected && (
                    <button
                      type="button"
                      onClick={() => handleSync(account.id)}
                      disabled={syncingAccount}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                      title="Refresh calendar list"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${syncingAccount ? "animate-spin" : ""}`} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleExpand(account.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Calendar list */}
                {expanded && (
                  <div className="border-t px-3 py-2 space-y-1.5">
                    {loading && (
                      <p className="text-xs text-muted-foreground py-1">
                        Loading calendars…
                      </p>
                    )}
                    {!loading && calendars.length === 0 && (
                      <p className="text-xs text-muted-foreground py-1">
                        No calendars found. Try refreshing.
                      </p>
                    )}
                    {calendars.map((cal) => {
                      const calSelected = isCalendarSelected(
                        account.id,
                        cal.google_calendar_id
                      );
                      return (
                        <label
                          key={cal.google_calendar_id}
                          className="flex items-center gap-2.5 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={calSelected}
                            disabled={!selected}
                            onChange={() =>
                              toggleCalendar(account.id, cal.google_calendar_id)
                            }
                            className="h-3.5 w-3.5 shrink-0"
                          />
                          {cal.color ? (
                            <span
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ background: cal.color }}
                            />
                          ) : (
                            <span className="h-3 w-3 rounded-full shrink-0 bg-muted-foreground/30" />
                          )}
                          <span className={`text-sm truncate ${!selected ? "text-muted-foreground" : ""}`}>
                            {cal.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
