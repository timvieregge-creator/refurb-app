import { useEffect, useState } from "react";
import {
  getDeviceByInternalNumber,
  type DataErasureStatus,
  type Device,
  type DeviceCondition,
} from "./db/queries/devices";

const statusLabels: Record<string, string> = {
  received: "Eingegangen",
  identified: "Identifiziert",
  waiting_for_erasure: "Wartet auf Datenlöschung",
  erased: "Daten gelöscht",
  tested: "Getestet",
  waiting_for_repair: "Wartet auf Reparatur",
  in_repair: "In Reparatur",
  repair_failed: "Reparatur fehlgeschlagen",
  ready_for_grading: "Bereit für Grading",
  graded: "Gegradet",
  ready_for_sale: "Verkaufsbereit",
  reserved: "Reserviert",
  sold: "Verkauft",
  returned: "Retourniert",
  scrapped: "Ausgemustert",
};

export default function DeviceDetail() {
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const match = window.location.pathname.match(/^\/geraet\/(.+)$/);

    if (!match) {
      setError("Ungültige Geräte-URL.");
      setLoading(false);
      return;
    }

    const internalNumber = decodeURIComponent(match[1]);

    async function loadDevice() {
      try {
        const result = await getDeviceByInternalNumber(internalNumber);

        if (!result) {
          setError(`Gerät ${internalNumber} wurde nicht gefunden.`);
        } else {
          setDevice(result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fehler beim Laden des Geräts");
      } finally {
        setLoading(false);
      }
    }

    void loadDevice();
  }, []);

  if (loading) {
    return <main style={styles.main}><p>Gerät wird geladen...</p></main>;
  }

  if (error || !device) {
    return <main style={styles.main}><h1>Gerätedetails</h1><p style={styles.error}>{error || "Gerät wurde nicht gefunden."}</p></main>;
  }

  return (
    <main style={styles.main}>
      <h1>Gerätedetails</h1>
      <section style={styles.card}>
        <h2>{device.internal_number}</h2>
        <div style={styles.grid}>
          <Info label="Hersteller" value={device.manufacturer} />
          <Info label="Modell" value={device.model} />
          <Info label="Seriennummer" value={device.serial_number} />
          <Info label="IMEI 1" value={device.imei_1} />
          <Info label="IMEI 2" value={device.imei_2} />
          <Info label="Gerätetyp" value={device.device_type} />
          <Info label="Status" value={statusLabels[device.status] || device.status} />
          <Info label="Zustand" value={conditionLabel(device.condition)} />
          <Info label="Datenlöschung" value={erasureLabel(device.data_erasure_status)} />
          <Info label="Einkaufspreis" value={device.purchase_cost == null ? "-" : `${device.purchase_cost.toFixed(2)} €`} />
        </div>
        {device.defect_description && <p><strong>Defektbeschreibung:</strong> {device.defect_description}</p>}
        {device.inspection_notes && <p><strong>Prüfnotizen:</strong> {device.inspection_notes}</p>}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return <p><strong>{label}:</strong> {value || "-"}</p>;
}

function conditionLabel(value: DeviceCondition | null) {
  return ({ unknown: "Unbekannt", good: "Gut", used: "Gebraucht", damaged: "Beschädigt" } as Record<string, string>)[value || "unknown"];
}

function erasureLabel(value: DataErasureStatus | null) {
  return ({ unknown: "Unbekannt", not_started: "Nicht begonnen", in_progress: "In Bearbeitung", completed: "Abgeschlossen", failed: "Fehlgeschlagen" } as Record<string, string>)[value || "unknown"];
}

const styles = {
  main: { maxWidth: 900, margin: "0 auto", padding: 32, fontFamily: "Arial, sans-serif" },
  card: { border: "1px solid #ddd", borderRadius: 8, padding: 24, marginTop: 24 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 8 },
  error: { background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 6 },
};
