import { Injectable, computed, signal } from '@angular/core';

// PROTOTYPE — datos simulados en memoria, sin backend real. Ver NOTES.md.

export interface ZoneStat {
  name: string;
  label: string;
  count: number;
  capacity: number;
  occupancyPct: number;
}

export interface ClassCount {
  className: string;
  label: string;
  count: number;
}

export interface TimelinePoint {
  time: string;
  count: number;
}

export interface DomainEvent {
  type: string;
  label: string;
  zone: string;
  timestamp: string;
}

const ZONE_DEFS = [
  { name: 'entrada_norte', label: 'Entrada Norte', capacity: 20 },
  { name: 'entrada_sur', label: 'Entrada Sur', capacity: 20 },
  { name: 'entrada_este', label: 'Entrada Este', capacity: 15 },
  { name: 'entrada_oeste', label: 'Entrada Oeste', capacity: 15 },
];

const CLASS_DEFS = [
  { className: 'car', label: 'Coches' },
  { className: 'truck', label: 'Camiones' },
  { className: 'bus', label: 'Autobuses' },
  { className: 'motorcycle', label: 'Motos' },
  { className: 'person', label: 'Peatones' },
];

const EVENT_DEFS = [
  { type: 'vehiculo_entro', label: 'Vehículo entró' },
  { type: 'vehiculo_salio', label: 'Vehículo salió' },
  { type: 'cruce_congestionado', label: 'Congestión detectada' },
  { type: 'vehiculo_detenido', label: 'Vehículo detenido' },
  { type: 'cruce_peatonal_indebido', label: 'Cruce peatonal indebido' },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomWalk(value: number, capacity: number): number {
  const delta = randomInt(-2, 2);
  return Math.max(0, Math.min(capacity, value + delta));
}

@Injectable({ providedIn: 'root' })
export class MockDashboardService {
  private readonly zonesSignal = signal<ZoneStat[]>(
    ZONE_DEFS.map((z) => {
      const count = randomInt(2, z.capacity);
      return { ...z, count, occupancyPct: Math.round((count / z.capacity) * 100) };
    }),
  );

  private readonly classCountsSignal = signal<ClassCount[]>(
    CLASS_DEFS.map((c) => ({ ...c, count: randomInt(0, 30) })),
  );

  private readonly timelineSignal = signal<TimelinePoint[]>(this.seedTimeline());
  private readonly eventsSignal = signal<DomainEvent[]>(this.seedEvents());

  readonly zones = this.zonesSignal.asReadonly();
  readonly classCounts = this.classCountsSignal.asReadonly();
  readonly timeline = this.timelineSignal.asReadonly();
  readonly events = this.eventsSignal.asReadonly();

  readonly totalVehicles = computed(() =>
    this.zonesSignal().reduce((sum, z) => sum + z.count, 0),
  );

  readonly mostCongestedZone = computed(() =>
    [...this.zonesSignal()].sort((a, b) => b.occupancyPct - a.occupancyPct)[0],
  );

  constructor() {
    setInterval(() => this.tick(), 2500);
  }

  private tick(): void {
    this.zonesSignal.update((zones) =>
      zones.map((z) => {
        const count = randomWalk(z.count, z.capacity);
        return { ...z, count, occupancyPct: Math.round((count / z.capacity) * 100) };
      }),
    );

    this.classCountsSignal.update((classes) =>
      classes.map((c) => ({ ...c, count: Math.max(0, c.count + randomInt(-3, 3)) })),
    );

    this.timelineSignal.update((points) => {
      const next = [...points.slice(1)];
      next.push({ time: this.nowLabel(), count: this.totalVehicles() });
      return next;
    });

    if (Math.random() < 0.4) {
      const def = EVENT_DEFS[randomInt(0, EVENT_DEFS.length - 1)];
      const zone = ZONE_DEFS[randomInt(0, ZONE_DEFS.length - 1)];
      this.eventsSignal.update((events) =>
        [{ ...def, zone: zone.label, timestamp: this.nowLabel() }, ...events].slice(0, 8),
      );
    }
  }

  private seedTimeline(): TimelinePoint[] {
    const points: TimelinePoint[] = [];
    for (let i = 19; i >= 0; i--) {
      points.push({ time: `-${i * 30}s`, count: randomInt(10, 60) });
    }
    return points;
  }

  private seedEvents(): DomainEvent[] {
    return Array.from({ length: 4 }, () => {
      const def = EVENT_DEFS[randomInt(0, EVENT_DEFS.length - 1)];
      const zone = ZONE_DEFS[randomInt(0, ZONE_DEFS.length - 1)];
      return { ...def, zone: zone.label, timestamp: this.nowLabel() };
    });
  }

  private nowLabel(): string {
    return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
