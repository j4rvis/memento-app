## 1. calendar-day block

- [x] 1.1 Extract full-day entries from `dayEntries` into a separate `allDayEntries` array before building the slot list
- [x] 1.2 Compute `trimSlots = Math.max(0, allDayEntries.length - 2)` and reduce the total slot count by `trimSlots` (remove from end)
- [x] 1.3 Render one `<tr>` per all-day event above the time-slot rows, with the same `slotHeight` and entry styling (border-left color, background tint, escaped title)
- [x] 1.4 Remove the existing fallback that showed all-day events inside the first time slot

## 2. calendar-week block

- [x] 2.1 For each day in the week, separate all-day entries from timed entries in `entriesByDay`
- [x] 2.2 Compute `allDayRowCount = max across all days of their all-day event count`
- [x] 2.3 Compute `trimRows = Math.max(0, allDayRowCount - 2)` and reduce `totalHours` by `trimRows`
- [x] 2.4 Render `allDayRowCount` header rows above the time grid — each row shows the nth all-day event for each day column (empty cell if a day has fewer events)
- [x] 2.5 Confirm the existing `all_day` filter (`if (e.all_day) return false`) remains in the timed-event loop so full-day events don't also appear in time slots
