import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const monitoringModeEnum = pgEnum("monitoring_mode", [
  "full_page",
  "text",
  "selector",
]);

export const monitorStatusEnum = pgEnum("monitor_status", ["active", "paused"]);

export const checkStatusEnum = pgEnum("check_status", ["success", "failed"]);

export const changeSeverityEnum = pgEnum("change_severity", [
  "minor",
  "moderate",
  "major",
]);

export const notificationTypeEnum = pgEnum("notification_type", ["email"]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  email: text("email").notNull().unique(),

  name: text("name").notNull(),

  passwordHash: text("password_hash").notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const monitors = pgTable(
  "monitors",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    name: text("name").notNull(),

    url: text("url").notNull(),

    monitoringMode: monitoringModeEnum("monitoring_mode")
      .notNull()
      .default("full_page"),

    selector: text("selector"),

    frequencyMinutes: integer("frequency_minutes").notNull().default(360),

    status: monitorStatusEnum("status").notNull().default("active"),

    lastCheckedAt: timestamp("last_checked_at", {
      withTimezone: true,
    }),

    lastChangedAt: timestamp("last_changed_at", {
      withTimezone: true,
    }),

    nextCheckAt: timestamp("next_check_at", {
      withTimezone: true,
    }),

    monitorConfig: jsonb("monitor_config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("monitors_user_id_idx").on(table.userId),

    index("monitors_status_next_check_idx").on(table.status, table.nextCheckAt),
  ],
);

export const checks = pgTable(
  "checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, {
        onDelete: "cascade",
      }),

    status: checkStatusEnum("status").notNull(),

    changed: boolean("changed").notNull().default(false),

    httpStatus: integer("http_status"),

    responseTimeMs: integer("response_time_ms"),

    errorMessage: text("error_message"),

    checkedAt: timestamp("checked_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("checks_monitor_checked_idx").on(table.monitorId, table.checkedAt),
  ],
);

export const snapshots = pgTable(
  "snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, {
        onDelete: "cascade",
      }),

    checkId: uuid("check_id")
      .notNull()
      .references(() => checks.id, {
        onDelete: "cascade",
      }),

    contentHash: text("content_hash").notNull(),

    contentText: text("content_text").notNull(),

    contentHtml: text("content_html"),

    contentSize: integer("content_size").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("snapshots_monitor_created_idx").on(table.monitorId, table.createdAt),
  ],
);

export const changes = pgTable(
  "changes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, {
        onDelete: "cascade",
      }),

    previousSnapshotId: uuid("previous_snapshot_id")
      .notNull()
      .references(() => snapshots.id, {
        onDelete: "cascade",
      }),

    currentSnapshotId: uuid("current_snapshot_id")
      .notNull()
      .references(() => snapshots.id, {
        onDelete: "cascade",
      }),

    additions: text("additions").notNull(),

    removals: text("removals").notNull(),

    changePercentage: integer("change_percentage").notNull(),

    severity: changeSeverityEnum("severity").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("changes_monitor_created_idx").on(table.monitorId, table.createdAt),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, {
        onDelete: "cascade",
      }),

    changeId: uuid("change_id")
      .notNull()
      .references(() => changes.id, {
        onDelete: "cascade",
      }),

    type: notificationTypeEnum("type").notNull().default("email"),

    status: notificationStatusEnum("status").notNull().default("pending"),

    sentAt: timestamp("sent_at", {
      withTimezone: true,
    }),

    errorMessage: text("error_message"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("notifications_change_id_idx").on(table.changeId)],
);
