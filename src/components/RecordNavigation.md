# RecordNavigation Component

A generic React component for navigating between records in forms across the application. It provides left/right arrow navigation with instant cached navigation and boundary detection.

## Features

- **Generic Implementation**: Works with any record type and API endpoint
- **Instant Navigation**: Uses batched prefetching and local cache for seamless navigation
- **Boundary Detection**: Disables arrows when at first/last record
- **Customizable Display**: Configurable prefix and field for record display
- **Optimized Performance**: Smart caching reduces API calls and eliminates loading delays

## Current Integrations

The RecordNavigation component has been successfully integrated into the following modules:

- ✅ **Stock Transfer**: Integrated in `STFormDetails` - Navigate between STR records
- ✅ **Receiving Report**: Integrated in `RRFormDetails` - Navigate between RR records
- ✅ **Delivery Receipt**: Integrated in `SDRFormDetails` - Navigate between SDR records
- ✅ **Purchase Order**: Integrated in `POFormDetails` - Navigate between PO records

All integrations follow the same pattern and provide instant record navigation with soft, modern UI styling.

## Usage

### Basic Setup

1. **Import the component:**

```tsx
import RecordNavigation from "../../RecordNavigation";
```

2. **Add to your form details props interface:**

```tsx
export interface YourFormDetailsProps {
  openEdit: boolean;
  selectedRow: YourRecordType | undefined;
  setSelectedRow?: (record: YourRecordType) => void; // Add this line
  // ... other props
}
```

3. **Update your form details component:**

```tsx
const YourFormDetails = ({
  openEdit,
  selectedRow,
  setSelectedRow, // Add this parameter
  // ... other props
}: YourFormDetailsProps): JSX.Element => {
  return (
    <Card>
      <div>
        <div className="flex justify-between items-center mb-2">
          {openEdit && selectedRow && setSelectedRow ? (
            <RecordNavigation<YourRecordType>
              currentRecord={selectedRow}
              onRecordChange={setSelectedRow}
              apiEndpoint="/api/your-endpoint"
              recordIdField="id"
              recordDisplayField="id"
              recordDisplayPrefix="Your Prefix"
              sortBy="id"
              sortOrder="desc"
            />
          ) : openEdit && selectedRow ? (
            <div>
              <h4>Your Prefix {selectedRow.id}</h4>
            </div>
          ) : null}
        </div>
        {/* Rest of your form details */}
      </div>
    </Card>
  );
};
```

4. **Update your main form component to pass the prop:**

```tsx
<YourFormDetails
  openEdit={openEdit}
  selectedRow={selectedRow}
  setSelectedRow={setSelectedRow} // Add this line
  // ... other props
/>
```

5. **Update your parent component to include setSelectedRow in form props:**

```tsx
export interface YourFormProps {
  setOpen: (isOpen: boolean) => void;
  openCreate: boolean;
  openEdit: boolean;
  selectedRow?: YourRecordType;
  title: string;
  setSelectedRow?: (record: YourRecordType) => void; // Add this line
}
```

## Props

| Prop                  | Type                  | Description                                                      |
| --------------------- | --------------------- | ---------------------------------------------------------------- |
| `currentRecord`       | `T \| null`           | The currently selected record                                    |
| `onRecordChange`      | `(record: T) => void` | Callback when navigation changes the record                      |
| `apiEndpoint`         | `string`              | API endpoint for fetching records (e.g., "/api/stock-transfers") |
| `recordIdField`       | `keyof T`             | Field name used as the record identifier (usually "id")          |
| `recordDisplayField`  | `keyof T`             | Field name to display in the navigation (e.g., "id", "code")     |
| `recordDisplayPrefix` | `string`              | Text prefix for the display (e.g., "STR No.", "AR No.")          |
| `sortBy?`             | `string`              | Field to sort by (default: "id")                                 |
| `sortOrder?`          | `"asc" \| "desc"`     | Sort order (default: "desc")                                     |
| `additionalFilters?`  | `Record<string, any>` | Additional filters to apply when fetching records                |

## Examples

### Stock Transfer (Already Implemented)

```tsx
<RecordNavigation<StockTransfer>
  currentRecord={selectedRow}
  onRecordChange={setSelectedRow}
  apiEndpoint="/api/stock-transfers"
  recordIdField="id"
  recordDisplayField="id"
  recordDisplayPrefix="STR No."
  sortBy="id"
  sortOrder="desc"
/>
```

### Accounts Receivable

```tsx
<RecordNavigation<AR>
  currentRecord={selectedRow}
  onRecordChange={setSelectedRow}
  apiEndpoint="/api/accounts-receivable"
  recordIdField="id"
  recordDisplayField="id"
  recordDisplayPrefix="AR No."
  sortBy="id"
  sortOrder="desc"
/>
```

### Customer Purchase Order

```tsx
<RecordNavigation<CPO>
  currentRecord={selectedRow}
  onRecordChange={setSelectedRow}
  apiEndpoint="/api/customer-purchase-orders"
  recordIdField="id"
  recordDisplayField="id"
  recordDisplayPrefix="CPO No."
  sortBy="id"
  sortOrder="desc"
/>
```

### With Additional Filters

```tsx
<RecordNavigation<StockTransfer>
  currentRecord={selectedRow}
  onRecordChange={setSelectedRow}
  apiEndpoint="/api/stock-transfers"
  recordIdField="id"
  recordDisplayField="id"
  recordDisplayPrefix="STR No."
  sortBy="id"
  sortOrder="desc"
  additionalFilters={{ status: "posted" }}
/>
```

## Implementation Notes

1. **API Requirements**: The component expects the API to return paginated responses with the structure:

   ```typescript
   {
     total: number;
     items: T[];
   }
   ```

2. **Performance**: The component fetches records in batches and searches across multiple pages when needed. It limits the search to 10 pages to prevent infinite loops.

3. **Error Handling**: Network errors are logged to the console and navigation is gracefully disabled.

4. **State Management**: The component maintains its own loading and availability states for the navigation buttons.

## Integration Checklist

To add RecordNavigation to a new module:

- [ ] Import RecordNavigation component
- [ ] Add `setSelectedRow?: (record: T) => void` to form props interface
- [ ] Update form component to include RecordNavigation in edit mode
- [ ] Update parent component to pass setSelectedRow prop
- [ ] Test navigation functionality
- [ ] Verify loading states and boundary conditions
