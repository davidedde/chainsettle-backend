import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';

export const EVENTS_PROCESSED_COUNTER = 'chainsettle_events_processed_total';
export const EVENTS_FAILED_COUNTER = 'chainsettle_events_failed_total';
export const SHIPMENTS_CREATED_COUNTER = 'chainsettle_shipments_created_total';
export const ACTIVE_SHIPMENTS_GAUGE = 'chainsettle_active_shipments';
export const STELLAR_ENDPOINT_GAUGE = 'chainsettle_stellar_endpoint_healthy';
export const SHIPMENTS_BY_STATUS_GAUGE = 'chainsettle_shipments_by_status';
export const OPEN_DISPUTES_GAUGE = 'chainsettle_open_disputes';
export const DISPUTE_RESOLUTION_TIME_HISTOGRAM = 'chainsettle_dispute_resolution_time_hours';
export const WEBHOOK_DELIVERIES_COUNTER = 'chainsettle_webhook_deliveries_total';
export const WEBHOOK_DELIVERY_DURATION_HISTOGRAM = 'chainsettle_webhook_delivery_duration_seconds';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric(EVENTS_PROCESSED_COUNTER)
    private readonly eventsProcessed: Counter<string>,
    @InjectMetric(EVENTS_FAILED_COUNTER)
    private readonly eventsFailed: Counter<string>,
    @InjectMetric(SHIPMENTS_CREATED_COUNTER)
    private readonly shipmentsCreated: Counter<string>,
    @InjectMetric(ACTIVE_SHIPMENTS_GAUGE)
    private readonly activeShipments: Gauge<string>,
    @InjectMetric(STELLAR_ENDPOINT_GAUGE)
    private readonly stellarEndpoint: Gauge<string>,
    @InjectMetric(OPEN_DISPUTES_GAUGE) private readonly openDisputes: Gauge<string>,
    @InjectMetric(DISPUTE_RESOLUTION_TIME_HISTOGRAM) private readonly disputeResolutionTime: Histogram<string>,
    @InjectMetric(WEBHOOK_DELIVERIES_COUNTER) private readonly webhookDeliveries: Counter<string>,
    @InjectMetric(WEBHOOK_DELIVERY_DURATION_HISTOGRAM) private readonly webhookDeliveryDuration: Histogram<string>,
  ) {}

  /** 1 = healthy, 0 = unhealthy; `active` label marks the endpoint currently in use. */
  setStellarEndpointHealth(type: string, url: string, healthy: boolean, active: boolean): void {
    this.stellarEndpoint.set({ type, url, active: String(active) }, healthy ? 1 : 0);
    this.stellarEndpoint.remove({ type, url, active: String(!active) });
  }

  incrementEventsProcessed(eventName: string): void {
    this.eventsProcessed.inc({ eventName });
  }

  incrementEventsFailed(): void {
    this.eventsFailed.inc();
  }

  incrementShipmentsCreated(): void {
    this.shipmentsCreated.inc();
  }

  incrementActiveShipments(): void {
    this.activeShipments.inc();
  }

  decrementActiveShipments(): void {
    this.activeShipments.dec();
  }

  setOpenDisputes(count: number): void { this.openDisputes.set(count); }

  observeDisputeResolutionTime(hours: number): void { if (Number.isFinite(hours) && hours >= 0) this.disputeResolutionTime.observe(hours); }

  setActiveShipments(count: number): void {
    this.activeShipments.set(count);
  }

  observeWebhookDelivery(result: 'success' | 'failure', statusCode: number | null, durationSeconds: number): void {
    const statusCodeClass = statusCode === null ? 'none' : `${Math.floor(statusCode / 100)}xx`;
    this.webhookDeliveries.inc({ result, status_code_class: statusCodeClass });
    if (Number.isFinite(durationSeconds) && durationSeconds >= 0) {
      this.webhookDeliveryDuration.observe(durationSeconds);
    }
  }
}
