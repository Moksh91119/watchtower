export const MONITORING_MODES = ["full_page", "text", "selector"] as const;

export type MonitoringMode = (typeof MONITORING_MODES)[number];
