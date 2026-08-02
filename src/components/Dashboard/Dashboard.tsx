import type { ReactNode } from "react";
import Link from "next/link";
import Alert from "@mui/joy/Alert";
import Button from "@mui/joy/Button";
import Skeleton from "@mui/joy/Skeleton";
import Typography from "@mui/joy/Typography";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ShoppingCartCheckoutRoundedIcon from "@mui/icons-material/ShoppingCartCheckoutRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import { useCompanyContext } from "../../hooks/useCompanyContext";
import { addCommaToNumberWithTwoPlaces } from "../../helper";
import { useDashboardData } from "./useDashboardData";
import styles from "./Dashboard.module.css";

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function Dashboard(): JSX.Element {
  const { currentCompany, companies } = useCompanyContext();
  const { data, error, isLoading, refresh } = useDashboardData();
  const companyName =
    companies.find((company) => company.code === currentCompany)?.name ??
    "Current company";

  if (isLoading && data === null) {
    return <DashboardSkeleton />;
  }

  if (error !== null && data === null) {
    return (
      <Alert
        color="danger"
        variant="soft"
        startDecorator={<ErrorOutlineRoundedIcon />}
        endDecorator={
          <Button
            size="sm"
            variant="outlined"
            color="danger"
            startDecorator={<RefreshRoundedIcon />}
            onClick={async () => await refresh()}
          >
            Try again
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (data === null) return <></>;

  const totalPosition =
    data.inventory.availableUnits + data.inventory.allocatedUnits;
  const availableShare =
    totalPosition > 0
      ? (data.inventory.availableUnits / totalPosition) * 100
      : 0;
  const allocatedShare = totalPosition > 0 ? 100 - availableShare : 0;

  const attentionItems = [
    {
      label: "Stockouts",
      value: data.inventory.stockoutCount,
      detail: "Active SKUs with no available units",
      href: "/configuration/item",
      tone: data.inventory.stockoutCount > 0 ? "critical" : "clear",
    },
    {
      label: "Tight availability",
      value: data.inventory.tightAvailabilityCount,
      detail: "Allocated units meet or exceed available units",
      href: "/configuration/item",
      tone: data.inventory.tightAvailabilityCount > 0 ? "warning" : "clear",
    },
    {
      label: "Unplanned allocations",
      value: data.workflow.unplannedAllocations,
      detail: "Posted allocations not yet in a delivery plan",
      href: "/sales/allocation",
      tone: data.workflow.unplannedAllocations > 0 ? "warning" : "clear",
    },
    {
      label: "Pending checks",
      value: data.finance.pendingCheckCount,
      detail: "Uncleared customer checks awaiting completion",
      href: "/sales/ar-receipts",
      tone: data.finance.pendingCheckCount > 0 ? "critical" : "clear",
    },
  ] as const;

  return (
    <div className={styles.dashboard}>
      <p className={styles.visuallyHidden} role="status" aria-live="polite">
        Operations dashboard updated {dateFormatter.format(data.loadedAt)}.
      </p>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Operations board · {companyName}</p>
          <Typography
            component="h1"
            className={styles.title}
            sx={{ fontFamily: "inherit" }}
          >
            Good day, {firstName(data.user.full_name)}.
          </Typography>
          <p className={styles.intro}>
            Start with the exceptions. Everything below links to the queue where
            work happens.
          </p>
        </div>
        <div className={styles.freshness}>
          <span>Updated</span>
          <strong>{dateFormatter.format(data.loadedAt)}</strong>
          <Button
            size="sm"
            variant="plain"
            color="neutral"
            startDecorator={<RefreshRoundedIcon />}
            loading={isLoading}
            onClick={async () => await refresh()}
          >
            Refresh
          </Button>
        </div>
      </header>

      {error !== null && (
        <Alert color="warning" variant="soft" role="status">
          {error} Showing the last successful snapshot.
        </Alert>
      )}

      <section aria-labelledby="attention-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionIndex}>01 / Attention</p>
            <Typography id="attention-heading" level="h3">
              Work the exceptions first
            </Typography>
          </div>
          <span className={styles.sectionNote}>
            Counts reflect the latest refresh for the selected company
          </span>
        </div>
        <div className={styles.attentionGrid}>
          {attentionItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`${styles.attentionCard} ${
                styles[`attentionCard--${item.tone}`]
              }`}
            >
              <span className={styles.attentionLabel}>{item.label}</span>
              <strong>{integerFormatter.format(item.value)}</strong>
              <span className={styles.attentionDetail}>{item.detail}</span>
              <ArrowForwardRoundedIcon aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.positionGrid} aria-label="Inventory position">
        <article className={styles.positionPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>02 / Inventory position</p>
              <Typography level="h3">What can move today</Typography>
            </div>
            <Inventory2RoundedIcon aria-hidden="true" />
          </div>
          <div className={styles.metricRow}>
            <Metric
              label="Active SKUs"
              value={integerFormatter.format(data.inventory.activeSkus)}
            />
            <Metric
              label="Available units"
              value={integerFormatter.format(data.inventory.availableUnits)}
            />
            <Metric
              label="Committed units"
              value={integerFormatter.format(data.inventory.allocatedUnits)}
            />
          </div>
          <figure className={styles.positionFigure}>
            <figcaption>
              <strong>Available vs. committed units</strong>
              <span>
                Physical position across every active SKU and warehouse
              </span>
            </figcaption>
            <div
              className={styles.positionBar}
              role="img"
              aria-label={`${integerFormatter.format(
                data.inventory.availableUnits,
              )} available units and ${integerFormatter.format(
                data.inventory.allocatedUnits,
              )} committed units`}
            >
              <span
                className={styles.availableSegment}
                style={{ width: `${availableShare}%` }}
              />
              <span
                className={styles.allocatedSegment}
                style={{ width: `${allocatedShare}%` }}
              />
            </div>
            <div className={styles.positionLegend}>
              <span>
                <i className={styles.availableKey} /> Available{" "}
                {integerFormatter.format(data.inventory.availableUnits)}
              </span>
              <span>
                <i className={styles.allocatedKey} /> Committed{" "}
                {integerFormatter.format(data.inventory.allocatedUnits)}
              </span>
            </div>
          </figure>
        </article>

        <article className={styles.flowPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>03 / Supply flow</p>
              <Typography level="h3">
                Queues between order and delivery
              </Typography>
            </div>
            <LocalShippingRoundedIcon aria-hidden="true" />
          </div>
          <ol className={styles.flowRail}>
            <FlowStep
              icon={<ShoppingCartCheckoutRoundedIcon />}
              label="Purchase"
              detail="Draft POs"
              value={data.workflow.draftPurchaseOrders}
              href="/purchasing/purchase-order"
            />
            <FlowStep
              icon={<WarehouseRoundedIcon />}
              label="Receive"
              detail="Draft receiving reports"
              value={data.workflow.draftReceivingReports}
              href="/purchasing/receiving-report"
            />
            <FlowStep
              icon={<AssignmentTurnedInRoundedIcon />}
              label="Plan"
              detail="Unplanned allocations"
              value={data.workflow.unplannedAllocations}
              href="/sales/allocation"
            />
            <FlowStep
              icon={<LocalShippingRoundedIcon />}
              label="Dispatch"
              detail="Draft delivery plans"
              value={data.workflow.draftDeliveryPlans}
              href="/sales/delivery-planning"
            />
          </ol>
        </article>
      </section>

      <section className={styles.tableGrid}>
        <article className={styles.tablePanel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>04 / Stock pressure</p>
              <Typography level="h3">Lowest availability</Typography>
            </div>
            <Link href="/configuration/item" className={styles.textLink}>
              View stocks <ArrowForwardRoundedIcon />
            </Link>
          </div>
          {data.inventory.attentionItems.length === 0 ? (
            <EmptyPanel
              title="No active stock records yet"
              detail="Add stock records to start monitoring availability."
              href="/configuration/item"
              action="Open stocks"
            />
          ) : (
            <div className={styles.tableScroller}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Available</th>
                    <th>Committed</th>
                    <th>Pressure</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inventory.attentionItems.map((item) => {
                    const available = Number(item.total_on_stock ?? 0);
                    const allocated = Number(item.total_allocated ?? 0);
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.stock_code}</strong>
                          <span>{item.name}</span>
                        </td>
                        <td>{integerFormatter.format(available)}</td>
                        <td>{integerFormatter.format(allocated)}</td>
                        <td>
                          <StatusLabel
                            tone={
                              available <= 0
                                ? "critical"
                                : allocated >= available
                                  ? "warning"
                                  : "clear"
                            }
                            label={
                              available <= 0
                                ? "Stockout"
                                : allocated >= available
                                  ? "Tight"
                                  : "Available"
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className={styles.tablePanel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>05 / Receivables</p>
              <Typography level="h3">Largest open balances</Typography>
            </div>
            <Link href="/configuration/customer" className={styles.textLink}>
              View customers <ArrowForwardRoundedIcon />
            </Link>
          </div>
          <div className={styles.financeStrip}>
            <Metric
              label="Total receivable"
              value={`₱${addCommaToNumberWithTwoPlaces(
                data.finance.totalReceivable,
              )}`}
            />
            <Metric
              label="Uncleared"
              value={`₱${addCommaToNumberWithTwoPlaces(
                data.finance.totalUncleared,
              )}`}
            />
            <Metric
              label="Bounced"
              value={`₱${addCommaToNumberWithTwoPlaces(
                data.finance.totalBounced,
              )}`}
            />
          </div>
          {data.finance.topReceivables.length === 0 ? (
            <EmptyPanel
              title="No open receivables"
              detail="Customer balances will appear here when invoices are outstanding."
              href="/sales/ar-receipts"
              action="Open A.R. receipts"
            />
          ) : (
            <div className={styles.tableScroller}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Receivable</th>
                    <th>Uncleared</th>
                  </tr>
                </thead>
                <tbody>
                  {data.finance.topReceivables.map((customer) => (
                    <tr key={customer.customer_id}>
                      <td>
                        <strong>{customer.customer_name}</strong>
                      </td>
                      <td>
                        ₱
                        {addCommaToNumberWithTwoPlaces(
                          Number(customer.amount_receivable),
                        )}
                      </td>
                      <td>
                        ₱
                        {addCommaToNumberWithTwoPlaces(
                          Number(customer.uncleared_payment),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section aria-labelledby="quick-actions-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionIndex}>06 / Shortcuts</p>
            <Typography id="quick-actions-heading" level="h3">
              Move directly into a workflow
            </Typography>
          </div>
        </div>
        <div className={styles.quickActions}>
          <QuickAction
            icon={<Inventory2RoundedIcon />}
            label="Manage stocks"
            detail="Availability, pricing, and item records"
            href="/configuration/item"
          />
          <QuickAction
            icon={<ShoppingCartCheckoutRoundedIcon />}
            label="Create purchase order"
            detail="Start an inbound supplier order"
            href="/purchasing/purchase-order"
          />
          <QuickAction
            icon={<ReceiptLongRoundedIcon />}
            label="Plan customer delivery"
            detail="Move posted allocations into dispatch"
            href="/sales/delivery-planning"
          />
          <QuickAction
            icon={<PaymentsRoundedIcon />}
            label="Record A.R. receipt"
            detail="Apply customer payments and checks"
            href="/sales/ar-receipts"
          />
        </div>
      </section>
    </div>
  );
}

function firstName(fullName: string): string {
  const name = fullName.trim().split(/\s+/)[0];
  return name !== "" ? name : "there";
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}): JSX.Element {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FlowStep({
  icon,
  label,
  detail,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  value: number;
  href: string;
}): JSX.Element {
  return (
    <li>
      <Link href={href}>
        <span className={styles.flowIcon}>{icon}</span>
        <span className={styles.flowCopy}>
          <strong>{label}</strong>
          <small>{detail}</small>
        </span>
        <b>{integerFormatter.format(value)}</b>
      </Link>
    </li>
  );
}

function QuickAction({
  icon,
  label,
  detail,
  href,
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  href: string;
}): JSX.Element {
  return (
    <Link href={href} className={styles.quickAction}>
      <span>{icon}</span>
      <strong>{label}</strong>
      <small>{detail}</small>
      <ArrowForwardRoundedIcon aria-hidden="true" />
    </Link>
  );
}

function StatusLabel({
  tone,
  label,
}: {
  tone: "critical" | "warning" | "clear";
  label: string;
}): JSX.Element {
  return (
    <span className={`${styles.status} ${styles[`status--${tone}`]}`}>
      {label}
    </span>
  );
}

function EmptyPanel({
  title,
  detail,
  href,
  action,
}: {
  title: string;
  detail: string;
  href: string;
  action: string;
}): JSX.Element {
  return (
    <div className={styles.emptyPanel}>
      <strong>{title}</strong>
      <span>{detail}</span>
      <Link href={href}>{action}</Link>
    </div>
  );
}

function DashboardSkeleton(): JSX.Element {
  return (
    <div
      className={styles.dashboard}
      aria-busy="true"
      aria-label="Loading operations dashboard"
    >
      <header className={styles.hero}>
        <div className={styles.skeletonHeading}>
          <p className={styles.eyebrow}>Operations board</p>
          <Skeleton variant="text" level="h1" width="min(34rem, 90%)" />
          <p className={styles.intro}>
            Start with the exceptions. Everything below links to the queue where
            work happens.
          </p>
        </div>
      </header>

      <section>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionIndex}>01 / Attention</p>
            <Typography level="h3">Work the exceptions first</Typography>
          </div>
        </div>
        <div className={styles.attentionGrid}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height={150}
              sx={{ borderRadius: "md" }}
            />
          ))}
        </div>
      </section>

      <section className={styles.positionGrid}>
        <article className={styles.positionPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>02 / Inventory position</p>
              <Typography level="h3">What can move today</Typography>
            </div>
          </div>
          <div className={styles.metricRow}>
            {Array.from({ length: 3 }, (_, index) => (
              <div className={styles.metric} key={index}>
                <Skeleton variant="text" width={90} />
                <Skeleton variant="text" level="h2" width={80} />
              </div>
            ))}
          </div>
          <div className={styles.positionFigure}>
            <strong>Available vs. committed units</strong>
            <Skeleton variant="rectangular" height={18} />
            <Skeleton variant="text" width={210} />
          </div>
        </article>
        <article className={styles.flowPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>03 / Supply flow</p>
              <Typography level="h3">
                Queues between order and delivery
              </Typography>
            </div>
          </div>
          <div className={styles.flowRail}>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                height={50}
                sx={{ mb: 1, borderRadius: "sm" }}
              />
            ))}
          </div>
        </article>
      </section>

      <section className={styles.tableGrid}>
        <SkeletonTable
          index="04 / Stock pressure"
          title="Lowest availability"
          headers={["Stock", "Available", "Committed", "Pressure"]}
        />
        <SkeletonTable
          index="05 / Receivables"
          title="Largest open balances"
          headers={["Customer", "Receivable", "Uncleared"]}
        />
      </section>

      <section>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionIndex}>06 / Shortcuts</p>
            <Typography level="h3">Move directly into a workflow</Typography>
          </div>
        </div>
        <div className={styles.quickActions}>
          <QuickAction
            icon={<Inventory2RoundedIcon />}
            label="Manage stocks"
            detail="Availability, pricing, and item records"
            href="/configuration/item"
          />
          <QuickAction
            icon={<ShoppingCartCheckoutRoundedIcon />}
            label="Create purchase order"
            detail="Start an inbound supplier order"
            href="/purchasing/purchase-order"
          />
          <QuickAction
            icon={<ReceiptLongRoundedIcon />}
            label="Plan customer delivery"
            detail="Move posted allocations into dispatch"
            href="/sales/delivery-planning"
          />
          <QuickAction
            icon={<PaymentsRoundedIcon />}
            label="Record A.R. receipt"
            detail="Apply customer payments and checks"
            href="/sales/ar-receipts"
          />
        </div>
      </section>
    </div>
  );
}

function SkeletonTable({
  index,
  title,
  headers,
}: {
  index: string;
  title: string;
  headers: string[];
}): JSX.Element {
  return (
    <article className={styles.tablePanel}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.sectionIndex}>{index}</p>
          <Typography level="h3">{title}</Typography>
        </div>
      </div>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header, columnIndex) => (
                <td key={header}>
                  <Skeleton
                    variant="text"
                    width={`${58 + ((rowIndex + columnIndex) % 3) * 12}%`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
