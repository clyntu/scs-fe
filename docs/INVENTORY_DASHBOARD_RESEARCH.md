# Inventory Operations Dashboard Research

Prepared 2026-08-02 for the SCS authenticated home page.

## Product context

SCS is a multi-company inventory and distribution system covering stocks,
warehouses, purchasing, receiving, customer orders, allocations, delivery,
returns, and accounts receivable. The local analysis documents identify the
missing authenticated dashboard as the highest-leverage UX gap:

- `SCS-Analysis-Report.md`
- `SCS-AI-Opportunities.md`

The MVP should be an operational launchpad, not an executive analytics report.
Its primary user is a staff member or administrator starting a work session.
Its single job is to reveal exceptions and route the user to the queue where
the corrective work happens.

## Primary-source findings

### Prioritize current state and action

Microsoft describes a dashboard as an overview for monitoring the current
state of data. It recommends putting the highest-level information at the top
left, removing nonessential detail, emphasizing important numbers, and letting
users drill into underlying reports.

Source:
[Microsoft Power BI dashboard design tips](https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips)

Carbon recommends flat tiles for grouped information and clickable tiles when
the surface navigates or prompts an action. Tiles should remain on the same
visual plane rather than using decorative elevation.

Source:
[IBM Carbon tile usage](https://carbondesignsystem.com/components/tile/usage/)

### Lead with inventory position and demand pressure

Microsoft Dynamics inventory dashboards explicitly pair physical availability,
reserved inventory, demand, returns, and out-of-stock measures. They also use
product tables for the detailed exceptions behind the summary.

Source:
[Dynamics 365 inventory dashboards](https://learn.microsoft.com/en-us/dynamics365/intelligent-order-management/inventory-dashboards)

Oracle's Supply Chain Control Tower documentation frames inventory decisions as
the relationship between current inventory, incoming supply, and customer
demand. Purchase orders represent supply while sales orders represent demand.

Source:
[Oracle NetSuite Supply Chain Control Tower](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1519947103.html)

SAP's official Control Tower training emphasizes threshold-based alerts for
inventory shortages and supply-demand imbalances. It also warns that alert
volume should remain healthy rather than flooding users with noise.

Source:
[SAP Supply Chain Control Tower custom alerts](https://learning.sap.com/courses/discovering-sap-ibp-for-supply-chain-control-tower/optimizing-custom-alerts-in-sap-supply-chain-control-tower)

### Use honest, restrained visualizations

Microsoft recommends bar and column charts for comparisons, cautions against
circular and 3D charts, and advises consistent scales and readable numerical
precision. For the SCS MVP, the data contains fewer than twenty headline
numbers, so numbers and tables communicate more precisely than a collection of
charts. A single two-part bar is appropriate for available versus committed
inventory.

Source:
[Microsoft Power BI dashboard design tips](https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips)

### Loading and empty states must match the actual surface

Carbon says skeletons should represent container-based or data-based components,
while static action controls generally should not be skeletonized. Dashboards
that load from multiple sources are a specific use case for progressive
loading. Empty states should explain what will appear and provide a constructive
next action.

Sources:

- [IBM Carbon loading pattern](https://carbondesignsystem.com/patterns/loading-pattern/)
- [IBM Carbon empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/)

### Responsive and accessible behavior

WCAG 2.2 Reflow requires content to remain usable at a width equivalent to 320
CSS pixels without two-dimensional scrolling, except for data tables and other
content whose meaning requires a two-dimensional layout. Status changes such as
loading and refresh completion must be programmatically determinable for
assistive technology.

Sources:

- [WCAG 2.2 Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [WCAG 2.2 Understanding Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

## Recommended information hierarchy

1. **Attention queue**
   - Active SKUs with no available units
   - SKUs where allocated units meet or exceed available units
   - Posted allocations not yet included in delivery planning
   - Pending checks at or beyond their clearing date
2. **Inventory position**
   - Active SKU count
   - Available units
   - Allocated/committed units
   - Available-versus-committed two-part bar
3. **Supply flow**
   - Draft purchase orders
   - Draft receiving reports
   - Unplanned allocations
   - Draft delivery plans
4. **Exception details**
   - Lowest-availability stock records
   - Largest customer receivable balances
5. **Workflow shortcuts**
   - Stocks
   - Purchase orders
   - Delivery planning
   - A.R. receipts

Every exception tile and table heading should link to the existing module where
the user can act.

## MVP scope

- Aggregate existing tenant-scoped APIs in the frontend.
- Show exact counts and balances already supported by the current schema.
- Avoid reorder-point, lead-time, trend, and forecasting claims that the current
  data model cannot calculate reliably.
- Provide a layout-matching dashboard skeleton, retryable error state, and
  constructive empty states.
- Make `/` conditional: Login when signed out, Operations Dashboard when signed
  in.
- Include the dashboard in primary navigation.

## Later phases

- A dedicated backend summary endpoint to reduce concurrent requests.
- Warehouse-level stock and demand filtering.
- Inventory ledger trends and small multiples.
- Supplier lead-time reliability.
- Reorder thresholds after the schema has a maintained threshold field.
- Aging buckets and collections prioritization.
- Saved role-specific dashboard views.

The later-phase metrics should not be introduced until their formulas and data
freshness are explicit in the UI.
