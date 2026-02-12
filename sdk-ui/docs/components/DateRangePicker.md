# DateRangePicker

Date range picker using two coordinated DatePicker calendars.

```tsx
import { DateRangePicker } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above the picker pair. |
| startDate | `string` | `""` | Start date value (YYYY-MM-DD). |
| endDate | `string` | `""` | End date value (YYYY-MM-DD). |
| onChange | `(range: { startDate: string; endDate: string }) => void` | — | Called when either date changes. |
| min | `string` | — | Minimum selectable date for the start input. |
| max | `string` | — | Maximum selectable date for the end input. |
| startLabel | `string` | `"Start"` | Label for the start date picker. |
| endLabel | `string` | `"End"` | Label for the end date picker. |
| startPlaceholder | `string` | `"Start date"` | Placeholder for start input. |
| endPlaceholder | `string` | `"End date"` | Placeholder for end input. |
| helperText | `string` | — | Helper text below. |
| error | `string` | — | Error message. |
| disabled | `boolean` | `false` | Disables both pickers. |

## Examples

```tsx
<DateRangePicker
  label="Date Range"
  startDate={range.startDate}
  endDate={range.endDate}
  onChange={setRange}
/>

<DateRangePicker
  label="Trip Dates"
  startLabel="Departure"
  endLabel="Return"
  startDate={trip.start}
  endDate={trip.end}
  onChange={(r) => setTrip({ start: r.startDate, end: r.endDate })}
  min="2025-01-01"
/>
```
