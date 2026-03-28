## ADDED Requirements

### Requirement: Calendar blocks display full-day events in a dedicated section
Both `calendar-day` and `calendar-week` blocks SHALL render full-day events (`all_day: true`) in a dedicated all-day section above the time grid, not inside a time slot.

#### Scenario: Single full-day event appears above the time grid
- **WHEN** a `calendar-day` block has one full-day event
- **THEN** that event is rendered in a row above the first time slot, visually separate from timed events

#### Scenario: Multiple full-day events stack vertically
- **WHEN** a `calendar-day` block has three full-day events
- **THEN** each event occupies its own row, stacked top-to-bottom in the all-day section

#### Scenario: Week view shows full-day events per-column
- **WHEN** a `calendar-week` block has full-day events on different days
- **THEN** each day column shows its own full-day events in the all-day rows, and all columns share the same number of all-day rows (equal to the maximum across any single day)

### Requirement: Calendar block total height stays fixed when full-day events are present
When full-day events are rendered, the calendar block SHALL compensate by trimming the visible time range from the end, keeping the total rendered height constant.

#### Scenario: Up to two full-day events — no time range trim
- **WHEN** a `calendar-day` block has 1 or 2 full-day events
- **THEN** the visible time range (start hour to end hour) is unchanged

#### Scenario: Three full-day events trims one slot from end (day view)
- **WHEN** a `calendar-day` block has 3 full-day events and a configured time range of 7:00–21:00
- **THEN** the visible time range ends at 20:30 (one 30-minute slot removed from the bottom)

#### Scenario: Four full-day events trims two slots from end (day view)
- **WHEN** a `calendar-day` block has 4 full-day events and a configured time range of 7:00–21:00
- **THEN** the visible time range ends at 20:00 (two 30-minute slots removed from the bottom)

#### Scenario: Week view trims one hour per extra all-day row beyond two
- **WHEN** a `calendar-week` block has a day with 3 full-day events and a configured range of 8:00–20:00
- **THEN** the visible time range ends at 19:00 (one hourly row removed from the bottom)

### Requirement: All-day section row height equals the configured slot height
Each all-day event row SHALL have the same height as a regular time-slot row (`slot_height_mm`), so that the total block height calculation remains `(allDayRows + timeSlotRows) × slotHeightMm`.

#### Scenario: All-day row height matches slot height
- **WHEN** a `calendar-day` block has `slot_height_mm: 5` and two full-day events
- **THEN** each all-day row is rendered at 5 mm height

### Requirement: All-day section preserves entry styling
Full-day events in the all-day section SHALL use the same visual style as timed events (border-left color, background tint, escaped title).

#### Scenario: Full-day event uses event color
- **WHEN** a full-day event has `color: "#EA4335"`
- **THEN** the rendered all-day row cell has `border-left-color:#EA4335` and a matching background tint
