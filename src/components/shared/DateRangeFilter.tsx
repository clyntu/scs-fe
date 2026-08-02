import { FormControl, FormLabel, Input } from "@mui/joy";

interface DateRangeFilterProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDefaultDateFrom(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return toLocalDateString(d);
}

export function getDefaultDateTo(): string {
  return toLocalDateString(new Date());
}

const DateRangeFilter = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: DateRangeFilterProps): JSX.Element => {
  return (
    <>
      <FormControl>
        <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Date From</FormLabel>
        <Input
          type="date"
          size="sm"
          sx={{
            width: 165,
            "&::-webkit-calendar-picker-indicator": {
              cursor: "pointer",
              opacity: 0.6,
              filter: (theme) =>
                theme.palette.mode === "dark" ? "invert(1)" : "none",
            },
          }}
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
        />
      </FormControl>
      <FormControl>
        <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Date To</FormLabel>
        <Input
          type="date"
          size="sm"
          sx={{
            width: 165,
            "&::-webkit-calendar-picker-indicator": {
              cursor: "pointer",
              opacity: 0.6,
              filter: (theme) =>
                theme.palette.mode === "dark" ? "invert(1)" : "none",
            },
          }}
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
        />
      </FormControl>
    </>
  );
};

export default DateRangeFilter;
