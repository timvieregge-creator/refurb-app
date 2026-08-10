import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import { createSourceBatch, deleteSourceBatch, getSourceBatches, updateSourceBatch, type SourceBatch } from "./db/queries/batches";
import {
  createDevice,
  deleteDevice,
  getAllDevices,
  getDeviceByInternalNumber,
  getDevicesByBatch,
  searchDevices,
  transitionDevice,
  updateDevice,
  type DataErasureStatus,
  type Device,
  type DeviceCondition,
  type DeviceStatus,
} from "./db/queries/devices";
const [detailDevice, setDetailDevice] = useState<Device | null>(null);
const [detailLoading, setDetailLoading] = useState(false);
const statusOptions: [DeviceStatus, string][] = [["received", "Eingegangen"], ["identified", "Identifiziert"], ["waiting_for_erasure", "Wartet auf Datenlöschung"], ["erased", "Daten gelöscht"], ["tested", "Getestet"], ["waiting_for_repair", "Wartet auf Reparatur"], ["in_repair", "In Reparatur"], ["repair_failed", "Reparatur fehlgeschlagen"], ["ready_for_grading", "Bereit für Grading"], ["graded", "Gegradet"], ["ready_for_sale", "Verkaufsbereit"], ["reserved", "Reserviert"], ["sold", "Verkauft"], ["returned", "Retourniert"], ["scrapped", "Ausgemustert"]];

function App() {
  const [batches, setBatches] = useState<SourceBatch[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
const [allDevices, setAllDevices] = useState<Device[]>([]);
const [deviceSearch, setDeviceSearch] = useState("");
const [searchResults, setSearchResults] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [printDevice, setPrintDevice] = useState<Device | null>(null);

  const [supplierName, setSupplierName] = useState("");
  const [supplierReference, setSupplierReference] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("");
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 10));
  const [totalPurchaseCost, setTotalPurchaseCost] = useState("");
  const [transportCost, setTransportCost] = useState("");
  const [notes, setNotes] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const [batchSupplierFilter, setBatchSupplierFilter] = useState("");
  const [batchLotFilter, setBatchLotFilter] = useState("");

  const [serialNumber, setSerialNumber] = useState("");
  const [imei1, setImei1] = useState("");
  const [imei2, setImei2] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [deviceType, setDeviceType] = useState("notebook");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [condition, setCondition] = useState<DeviceCondition>("unknown");
  const [defectCategory, setDefectCategory] = useState("");
  const [defectDescription, setDefectDescription] = useState("");
  const [accessoriesComplete, setAccessoriesComplete] = useState("");
  const [dataErasureStatus, setDataErasureStatus] = useState<DataErasureStatus>("unknown");
  const [inspectionNotes, setInspectionNotes] = useState("");

useEffect(() => {
  const match = window.location.pathname.match(/^\/geraet\/(.+)$/);

  if (!match) {
    return;
  }

  const internalNumber = decodeURIComponent(match[1]);

  async function loadDetailDevice() {
    try {
      setDetailLoading(true);
      setError("");

      const device = await getDeviceByInternalNumber(internalNumber);

      if (!device) {
        setError("Gerät wurde nicht gefunden.");
        return;
      }

      setDetailDevice(device);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Fehler beim Laden des Geräts",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  void loadDetailDevice();
}, []);

async function loadInitialData() {
  try {
    setLoading(true);
    setError("");

    const [loadedBatches, loadedDevices] = await Promise.all([
      getSourceBatches(),
      getAllDevices(),
    ]);

    setBatches(loadedBatches);
    setAllDevices(loadedDevices);
    setSearchResults(loadedDevices);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Fehler beim Laden der Daten",
    );
  } finally {
    setLoading(false);
  }
}
useEffect(() => {
  void loadInitialData();
}, []);
  const suppliers = useMemo(() => [...new Set(batches.map((b) => b.supplier_name))].filter(Boolean).sort((a, b) => a.localeCompare(b, "de")), [batches]);
  const lots = useMemo(() => [...new Set(batches.map((b) => b.lot_number))].filter((x): x is string => Boolean(x)).sort((a, b) => a.localeCompare(b, "de")), [batches]);
  const filteredBatches = useMemo(() => {
    const search = batchSearch.trim().toLowerCase();
    return batches.filter((b) => {
      const text = [b.supplier_name, b.supplier_reference, b.lot_number, b.delivery_note_number, b.received_at, b.notes].filter(Boolean).join(" ").toLowerCase();
      return (!batchSupplierFilter || b.supplier_name === batchSupplierFilter) && (!batchLotFilter || b.lot_number === batchLotFilter) && (!search || text.includes(search));
    });
  }, [batches, batchSearch, batchSupplierFilter, batchLotFilter]);

  async function loadBatches() { try { setLoading(true); setError(""); setBatches(await getSourceBatches()); } catch (err) { setError(err instanceof Error ? err.message : "Fehler beim Laden"); } finally { setLoading(false); } }
  function resetBatchForm() { setEditingBatchId(null); setSupplierName(""); setSupplierReference(""); setLotNumber(""); setDeliveryNoteNumber(""); setReceivedAt(new Date().toISOString().slice(0, 10)); setTotalPurchaseCost(""); setTransportCost(""); setNotes(""); }
  function startBatchEditing(b: SourceBatch) { setEditingBatchId(b.id); setSupplierName(b.supplier_name); setSupplierReference(b.supplier_reference || ""); setLotNumber(b.lot_number || ""); setDeliveryNoteNumber(b.delivery_note_number || ""); setReceivedAt(b.received_at); setTotalPurchaseCost(String(b.total_purchase_cost ?? "")); setTransportCost(String(b.transport_cost ?? "")); setNotes(b.notes || ""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function handleBatchSubmit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (!supplierName.trim()) { setError("Bitte einen Lieferanten eingeben."); return; } const input = { supplierName, supplierReference, lotNumber, deliveryNoteNumber, receivedAt, totalPurchaseCost: parseNumber(totalPurchaseCost), transportCost: parseNumber(transportCost), notes }; try { setSaving(true); setError(""); if (editingBatchId) await updateSourceBatch(editingBatchId, input); else { const b = await createSourceBatch(input); setSelectedBatchId(b.id); setDevices([]); } resetBatchForm(); await loadBatches(); } catch (err) { setError(err instanceof Error ? err.message : "Fehler beim Speichern"); } finally { setSaving(false); } }
  async function handleBatchDelete(b: SourceBatch) { if (!window.confirm(`Soll die Einkaufspartie von "${b.supplier_name}" wirklich gelöscht werden?`)) return; try { setSaving(true); setError(""); await deleteSourceBatch(b.id); if (selectedBatchId === b.id) { setSelectedBatchId(""); setDevices([]); } if (editingBatchId === b.id) resetBatchForm(); await loadBatches(); } catch (err) { setError(err instanceof Error ? err.message : "Die Einkaufspartie konnte nicht gelöscht werden"); } finally { setSaving(false); } }
  async function handleBatchChange(id: string) { setSelectedBatchId(id); setDevices([]); setError(""); if (!id) return; try { setDevices(await getDevicesByBatch(id)); } catch (err) { setError(err instanceof Error ? err.message : "Fehler beim Laden der Geräte"); } }

  function resetDeviceForm() { setEditingDeviceId(null); setSerialNumber(""); setImei1(""); setImei2(""); setManufacturer(""); setModel(""); setDeviceType("notebook"); setPurchaseCost(""); setCondition("unknown"); setDefectCategory(""); setDefectDescription(""); setAccessoriesComplete(""); setDataErasureStatus("unknown"); setInspectionNotes(""); }
  function startDeviceEditing(d: Device) { setEditingDeviceId(d.id); setSerialNumber(d.serial_number || ""); setImei1(d.imei_1 || ""); setImei2(d.imei_2 || ""); setManufacturer(d.manufacturer || ""); setModel(d.model || ""); setDeviceType(d.device_type || "notebook"); setPurchaseCost(String(d.purchase_cost ?? "")); setCondition(d.condition || "unknown"); setDefectCategory(d.defect_category || ""); setDefectDescription(d.defect_description || ""); setAccessoriesComplete(d.accessories_complete == null ? "" : d.accessories_complete ? "yes" : "no"); setDataErasureStatus(d.data_erasure_status || "unknown"); setInspectionNotes(d.inspection_notes || ""); setError(""); }
  function deviceInput() { return { serialNumber, imei1, imei2, manufacturer, model, deviceType, purchaseCost: parseNumber(purchaseCost), condition, defectCategory, defectDescription, accessoriesComplete: accessoriesComplete === "" ? null : accessoriesComplete === "yes", dataErasureStatus, inspectionNotes }; }
  async function handleDeviceSubmit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (!selectedBatchId) { setError("Bitte zuerst eine Einkaufspartie auswählen."); return; } if (!serialNumber.trim() && !imei1.trim()) { setError("Bitte Seriennummer oder IMEI eingeben."); return; } try { setSaving(true); setError(""); if (editingDeviceId) await updateDevice(editingDeviceId, deviceInput()); else await createDevice({ sourceBatchId: selectedBatchId, ...deviceInput() }); resetDeviceForm(); setDevices(await getDevicesByBatch(selectedBatchId)); } catch (err) { setError(err instanceof Error ? err.message : "Fehler beim Speichern des Geräts"); } finally { setSaving(false); } }
  async function handleDeviceDelete(d: Device) { if (!window.confirm(`Soll das Gerät "${d.internal_number}" wirklich gelöscht werden?`)) return; try { setSaving(true); setError(""); await deleteDevice(d.id); if (editingDeviceId === d.id) resetDeviceForm(); if (selectedBatchId) setDevices(await getDevicesByBatch(selectedBatchId)); } catch (err) { setError(err instanceof Error ? err.message : "Das Gerät konnte nicht gelöscht werden"); } finally { setSaving(false); } }
  async function handleStatusChange(id: string, status: DeviceStatus) { try { setSaving(true); setError(""); await transitionDevice(id, status); if (selectedBatchId) setDevices(await getDevicesByBatch(selectedBatchId)); } catch (err) { setError(err instanceof Error ? err.message : "Fehler beim Ändern des Status"); } finally { setSaving(false); } }
function handlePrintDevice(d: Device) {
  setPrintDevice(d);
  document.body.classList.add("printing");

  window.setTimeout(() => {
    window.print();
  }, 150);
}

useEffect(() => {
  function handleAfterPrint() {
    document.body.classList.remove("printing");
    setPrintDevice(null);
  }

  window.addEventListener("afterprint", handleAfterPrint);

  return () => {
    window.removeEventListener("afterprint", handleAfterPrint);
  };
}, []);

  return <>
{window.location.pathname.startsWith("/geraet/") ? (
  <main style={styles.main}>
    <h1>Gerätedetails</h1>

    {detailLoading && <p>Gerät wird geladen...</p>}

    {!detailLoading && !detailDevice && (
      <p>Kein Gerät gefunden.</p>
    )}

    {detailDevice && (
      <section style={styles.section}>
        <h2>{detailDevice.internal_number}</h2>

        <div style={styles.detailGrid}>
          
<p>
            <strong>Hersteller:</strong>{" "}
            {detailDevice.manufacturer || "-"}
          </p>

          <p>
            <strong>Modell:</strong>{" "}
            {detailDevice.model || "-"}
          </p>

          <p>
            <strong>Seriennummer:</strong>{" "}
            {detailDevice.serial_number || "-"}
          </p>

          <p>
            <strong>IMEI 1:</strong>{" "}
            {detailDevice.imei_1 || "-"}
          </p>

          <p>
            <strong>IMEI 2:</strong>{" "}
            {detailDevice.imei_2 || "-"}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {statusLabel(detailDevice.status)}
          </p>

          <p>
            <strong>Zustand:</strong>{" "}
            {conditionLabel(detailDevice.condition)}
          </p>

          <p>
            <strong>Datenlöschung:</strong>{" "}
            {erasureLabel(detailDevice.data_erasure_status)}
          </p>

          <p>
            <strong>Einkaufspreis:</strong>{" "}
            {formatCurrency(detailDevice.purchase_cost)}
          </p>
        </div>
      </section>
    )}
  </main>
) : (
  <>
    {/* Dein bisheriger App-Inhalt kommt hier hinein */}
  </>
)}
    <main style={styles.main}>
      <h1>PLUS EDV Wareneingang</h1>
<section style={styles.section}>
  <h2>Dashboard</h2>

  <div style={styles.dashboardGrid}>
    <div style={styles.dashboardCard}>
      <strong>{allDevices.length}</strong>
      <span>Alle Geräte</span>
    </div>

    {statusOptions.map(([status, label]) => (
      <div key={status} style={styles.dashboardCard}>
        <strong>
          {
            allDevices.filter(
              (device) => device.status === status,
            ).length
          }
        </strong>
        <span>{label}</span>
      </div>
    ))}
  </div>
</section>
<section style={styles.section}>
  <h2>Gerätesuche</h2>

  <input
    value={deviceSearch}
    onChange={async (event) => {
      const value = event.target.value;
      setDeviceSearch(value);

      try {
        const results = await searchDevices(value);
        setSearchResults(results);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Fehler bei der Gerätesuche",
        );
      }
    }}
    placeholder="Seriennummer, IMEI, interne Nummer, Hersteller oder Modell"
    style={styles.input}
  />

  {deviceSearch.trim() && (
    <div style={{ marginTop: 16 }}>
      <strong>{searchResults.length} Treffer gefunden</strong>

      {searchResults.map((device) => (
        <div
          key={device.id}
          style={{
            padding: 12,
            marginTop: 8,
            border: "1px solid #ddd",
            borderRadius: 6,
          }}
        >
          <strong>{device.internal_number}</strong>
          <div>
            {[device.manufacturer, device.model]
              .filter(Boolean)
              .join(" ") || "Unbekanntes Gerät"}
          </div>
          <div>Seriennummer: {device.serial_number || "-"}</div>
          <div>IMEI 1: {device.imei_1 || "-"}</div>
          <div>Status: {statusLabel(device.status)}</div>
        </div>
      ))}
    </div>
  )}
</section><p>Einkaufspartien und Geräte verwalten</p>{error && <div style={styles.error}>{error}</div>}
      <section style={styles.section}><h2>{editingBatchId ? "Einkaufspartie bearbeiten" : "Neue Einkaufspartie"}</h2><form onSubmit={handleBatchSubmit}><div style={styles.grid}><Field label="Lieferant" value={supplierName} setValue={setSupplierName} placeholder="z. B. ABC GmbH" /><Field label="Lot-Nummer" value={lotNumber} setValue={setLotNumber} placeholder="z. B. LOT-2026-001" /><Field label="Lieferscheinnummer" value={deliveryNoteNumber} setValue={setDeliveryNoteNumber} placeholder="z. B. LS-4711" /><Field label="Lieferantenreferenz" value={supplierReference} setValue={setSupplierReference} placeholder="z. B. Bestellnummer" /><label>Eingangsdatum<input type="date" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} style={styles.input} /></label><Field label="Einkaufskosten" value={totalPurchaseCost} setValue={setTotalPurchaseCost} placeholder="0,00" /><Field label="Transportkosten" value={transportCost} setValue={setTransportCost} placeholder="0,00" /><Field label="Notiz" value={notes} setValue={setNotes} placeholder="Optional" /></div><div style={styles.buttonRow}><button type="submit" disabled={saving} style={styles.blueButton}>{saving ? "Speichert..." : editingBatchId ? "Änderung speichern" : "Partie speichern"}</button>{editingBatchId && <button type="button" onClick={resetBatchForm} style={styles.grayButton}>Abbrechen</button>}</div></form></section>
      <section style={styles.section}><h2>{editingDeviceId ? "Gerät bearbeiten" : "Gerät erfassen"}</h2><form onSubmit={handleDeviceSubmit}><label>Einkaufspartie<select value={selectedBatchId} onChange={(e) => void handleBatchChange(e.target.value)} disabled={Boolean(editingDeviceId)} style={styles.input}><option value="">Bitte auswählen</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.supplier_name}{b.lot_number ? ` - Lot ${b.lot_number}` : ""}{b.delivery_note_number ? ` - LS ${b.delivery_note_number}` : ""}</option>)}</select></label><div style={styles.grid}><Field label="Seriennummer" value={serialNumber} setValue={setSerialNumber} placeholder="Seriennummer" /><Field label="IMEI 1" value={imei1} setValue={setImei1} placeholder="Optional" /><Field label="IMEI 2" value={imei2} setValue={setImei2} placeholder="Optional" /><Field label="Hersteller" value={manufacturer} setValue={setManufacturer} placeholder="z. B. Dell" /><Field label="Modell" value={model} setValue={setModel} placeholder="z. B. Latitude 5420" /><label>Gerätetyp<select value={deviceType} onChange={(e) => setDeviceType(e.target.value)} style={styles.input}><option value="notebook">Notebook</option><option value="desktop">Desktop-PC</option><option value="monitor">Monitor</option><option value="smartphone">Smartphone</option><option value="tablet">Tablet</option><option value="server">Server</option><option value="other">Sonstiges</option></select></label><Field label="Einkaufspreis" value={purchaseCost} setValue={setPurchaseCost} placeholder="0,00" /><label>Zustand<select value={condition} onChange={(e) => setCondition(e.target.value as DeviceCondition)} style={styles.input}><option value="unknown">Unbekannt</option><option value="good">Gut</option><option value="used">Gebraucht</option><option value="damaged">Beschädigt</option></select></label><Field label="Defektkategorie" value={defectCategory} setValue={setDefectCategory} placeholder="z. B. Display, Akku" /><label>Zubehör vollständig<select value={accessoriesComplete} onChange={(e) => setAccessoriesComplete(e.target.value)} style={styles.input}><option value="">Unbekannt</option><option value="yes">Ja</option><option value="no">Nein</option></select></label><label>Datenlöschung<select value={dataErasureStatus} onChange={(e) => setDataErasureStatus(e.target.value as DataErasureStatus)} style={styles.input}><option value="unknown">Unbekannt</option><option value="not_started">Nicht begonnen</option><option value="in_progress">In Bearbeitung</option><option value="completed">Abgeschlossen</option><option value="failed">Fehlgeschlagen</option></select></label></div><label>Defektbeschreibung<textarea value={defectDescription} onChange={(e) => setDefectDescription(e.target.value)} style={styles.textarea} /></label><label>Prüfnotizen<textarea value={inspectionNotes} onChange={(e) => setInspectionNotes(e.target.value)} style={styles.textarea} /></label><div style={styles.buttonRow}><button type="submit" disabled={saving} style={styles.greenButton}>{saving ? "Speichert..." : editingDeviceId ? "Änderung speichern" : "Gerät speichern"}</button>{editingDeviceId && <button type="button" onClick={resetDeviceForm} style={styles.grayButton}>Abbrechen</button>}</div></form></section>
      <section style={styles.section}><h2>Vorhandene Partien</h2><div style={styles.filterGrid}><Field label="Suche" value={batchSearch} setValue={setBatchSearch} placeholder="Lieferant, Lot, Lieferschein..." /><label>Lieferant filtern<select value={batchSupplierFilter} onChange={(e) => setBatchSupplierFilter(e.target.value)} style={styles.input}><option value="">Alle Lieferanten</option>{suppliers.map((s) => <option key={s}>{s}</option>)}</select></label><label>Lot filtern<select value={batchLotFilter} onChange={(e) => setBatchLotFilter(e.target.value)} style={styles.input}><option value="">Alle Lots</option>{lots.map((l) => <option key={l}>{l}</option>)}</select></label></div>{loading ? <p>Lade Partien...</p> : filteredBatches.length === 0 ? <p>Keine passenden Einkaufspartien vorhanden.</p> : <table style={styles.table}><thead><tr>{["Lieferant", "Lot", "Lieferschein", "Referenz", "Eingang", "Einkaufskosten", "Aktionen"].map((x) => <th key={x} style={styles.cell}>{x}</th>)}</tr></thead><tbody>{filteredBatches.map((b) => <tr key={b.id}><td style={styles.cell}>{b.supplier_name}</td><td style={styles.cell}>{b.lot_number || "-"}</td><td style={styles.cell}>{b.delivery_note_number || "-"}</td><td style={styles.cell}>{b.supplier_reference || "-"}</td><td style={styles.cell}>{b.received_at}</td><td style={styles.cell}>{formatCurrency(b.total_purchase_cost)}</td><td style={styles.cell}><button onClick={() => startBatchEditing(b)} style={styles.smallBlueButton}>Bearbeiten</button> <button onClick={() => void handleBatchDelete(b)} style={styles.smallRedButton}>Löschen</button></td></tr>)}</tbody></table>}</section>
      <section style={styles.section}><h2>Geräte der ausgewählten Partie</h2>{!selectedBatchId ? <p>Bitte zuerst eine Einkaufspartie auswählen.</p> : devices.length === 0 ? <p>Noch keine Geräte in dieser Partie erfasst.</p> : <table style={styles.table}><thead><tr>{["Interne Nummer", "Seriennummer", "Modell", "Zustand", "Datenlöschung", "Status", "Aktionen"].map((x) => <th key={x} style={styles.cell}>{x}</th>)}</tr></thead><tbody>{devices.map((d) => <tr key={d.id}><td style={styles.cell}>{d.internal_number}</td><td style={styles.cell}>{d.serial_number || "-"}</td><td style={styles.cell}>{[d.manufacturer, d.model].filter(Boolean).join(" ") || "-"}</td><td style={styles.cell}>{conditionLabel(d.condition)}</td><td style={styles.cell}>{erasureLabel(d.data_erasure_status)}</td><td style={styles.cell}><select value={d.status} disabled={saving} onChange={(e) => void handleStatusChange(d.id, e.target.value as DeviceStatus)} style={styles.statusSelect}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td style={styles.cell}><div style={styles.actionRow}><button onClick={() => startDeviceEditing(d)} style={styles.smallBlueButton}>Bearbeiten</button><button onClick={() => void handleDeviceDelete(d)} style={styles.smallRedButton}>Löschen</button><button onClick={() => handlePrintDevice(d)} style={styles.smallGrayButton}>Drucken</button></div></td></tr>)}</tbody></table>}</section>
    </main>
{printDevice && (
  <div className="print-card">
    <div className="print-card-content">
      <QRCodeSVG
        value={`https://refurb-app-two.vercel.app/geraet/${encodeURIComponent(
          printDevice.internal_number,
        )}`}
        size={180}
        level="M"
        includeMargin
      />

      <h1>Geräteetikett</h1>

      <p className="print-number">
        {printDevice.internal_number}
      </p>

      <div className="print-details">
        <p>
          <strong>Hersteller:</strong>{" "}
          {printDevice.manufacturer || "-"}
        </p>

        <p>
          <strong>Modell:</strong>{" "}
          {printDevice.model || "-"}
        </p>

        <p>
          <strong>Seriennummer:</strong>{" "}
          {printDevice.serial_number || "-"}
        </p>

        <p>
          <strong>Zustand:</strong>{" "}
          {conditionLabel(printDevice.condition)}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {statusLabel(printDevice.status)}
        </p>
      </div>

      <p className="print-hint">
        QR-Code mit der Gerätenummer scannen
      </p>
    </div>
  </div>
)}
  </>;
}

function Field({ label, value, setValue, placeholder }: { label: string; value: string; setValue: (v: string) => void; placeholder?: string }) { return <label>{label}<input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} style={styles.input} /></label>; }
function parseNumber(value: string) { return Number(value.replace(",", ".")) || 0; }
function formatCurrency(value: number | null) { return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value ?? 0); }
function conditionLabel(value: DeviceCondition | null) { return ({ unknown: "Unbekannt", good: "Gut", used: "Gebraucht", damaged: "Beschädigt" } as Record<string, string>)[value || "unknown"]; }
function erasureLabel(value: DataErasureStatus | null) { return ({ unknown: "Unbekannt", not_started: "Nicht begonnen", in_progress: "In Bearbeitung", completed: "Abgeschlossen", failed: "Fehlgeschlagen" } as Record<string, string>)[value || "unknown"]; }
function statusLabel(value: string) { return statusOptions.find(([key]) => key === value)?.[1] || value; }

const styles = { main: { maxWidth: 1200, margin: "0 auto", padding: 32, fontFamily: "Arial, sans-serif" }, section: { border: "1px solid #ddd", borderRadius: 8, padding: 20, marginTop: 24, marginBottom: 32 }, 

detailGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
  marginTop: 16,
},

grid: { display: "grid", 
detailGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
  marginTop: 16,
},

gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginTop: 16 }, filterGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 },dashboardGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
  marginTop: 16,
},

dashboardCard: {
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
  padding: 16,
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#f8fafc",
}, input: { display: "block", width: "100%", boxSizing: "border-box" as const, marginTop: 6, padding: 10, border: "1px solid #bbb", borderRadius: 5 }, textarea: { display: "block", width: "100%", minHeight: 80, boxSizing: "border-box" as const, marginTop: 6, padding: 10, border: "1px solid #bbb", borderRadius: 5, resize: "vertical" as const }, buttonRow: { display: "flex", gap: 10, alignItems: "center" }, actionRow: { display: "flex", gap: 8, flexWrap: "wrap" as const }, blueButton: { marginTop: 20, padding: "10px 18px", border: 0, borderRadius: 6, background: "#2563eb", color: "white", cursor: "pointer" }, greenButton: { marginTop: 20, padding: "10px 18px", border: 0, borderRadius: 6, background: "#16a34a", color: "white", cursor: "pointer" }, grayButton: { marginTop: 20, padding: "10px 18px", border: 0, borderRadius: 6, background: "#6b7280", color: "white", cursor: "pointer" }, smallBlueButton: { padding: "6px 10px", border: 0, borderRadius: 5, background: "#2563eb", color: "white", cursor: "pointer" }, smallRedButton: { padding: "6px 10px", border: 0, borderRadius: 5, background: "#dc2626", color: "white", cursor: "pointer" }, smallGrayButton: { padding: "6px 10px", border: 0, borderRadius: 5, background: "#64748b", color: "white", cursor: "pointer" }, statusSelect: { padding: 6, borderRadius: 5, border: "1px solid #bbb" }, error: { background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 6, marginTop: 20 }, table: { width: "100%", borderCollapse: "collapse" as const }, cell: { textAlign: "left" as const, padding: 10, borderBottom: "1px solid #ddd", verticalAlign: "top" as const } };

export default App;
