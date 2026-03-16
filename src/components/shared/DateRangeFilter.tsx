import { FormControl, FormLabel, Input } from "@mui/joy";

interface DateRangeFilterProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

export function getDefaultDateFrom(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

export function getDefaultDateTo(): string {
  return new Date().toISOString().slice(0, 10);
}

const DateRangeFilter = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: DateRangeFilterProps): JSX.Element => {
  return (
    <>
      <FormControl sx={{ ml: 2 }}>
        <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Date From</FormLabel>
        <Input
          type="date"
          size="sm"
          sx={{ width: 160 }}
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
        />
      </FormControl>
      <FormControl sx={{ ml: 2 }}>
        <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Date To</FormLabel>
        <Input
          type="date"
          size="sm"
          sx={{ width: 160 }}
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
        />
      </FormControl>
    </>
  );
};

export default DateRangeFilter;
