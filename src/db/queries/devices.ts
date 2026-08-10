import { supabase } from "../supabaseClient";

export type DeviceStatus =
  | "received"
  | "identified"
  | "waiting_for_erasure"
  | "erased"
  | "tested"
  | "waiting_for_repair"
  | "in_repair"
  | "repair_failed"
  | "ready_for_grading"
  | "graded"
  | "ready_for_sale"
  | "reserved"
  | "sold"
  | "returned"
  | "scrapped";

export type DeviceCondition = "unknown" | "good" | "used" | "damaged";

export type DataErasureStatus =
  | "unknown"
  | "not_started"
  | "in_progress"
  | "completed"
  | "failed";

export type Device = {
  id: string;
  internal_number: string;
  source_batch_id: string | null;
  serial_number: string | null;
  imei_1: string | null;
  imei_2: string | null;
  manufacturer: string | null;
  model: string | null;
  device_type: string;
  status: DeviceStatus;
  purchase_cost: number | null;
  condition: DeviceCondition | null;
  defect_category: string | null;
  defect_description: string | null;
  accessories_complete: boolean | null;
  data_erasure_status: DataErasureStatus | null;
  inspection_notes: string | null;
  created_at: string;
};

export type DeviceInput = {
  serialNumber?: string;
  imei1?: string;
  imei2?: string;
  manufacturer?: string;
  model?: string;
  deviceType: string;
  purchaseCost?: number;
  condition?: DeviceCondition | null;
  defectCategory?: string;
  defectDescription?: string;
  accessoriesComplete?: boolean | null;
  dataErasureStatus?: DataErasureStatus | null;
  inspectionNotes?: string;
};

function createInternalNumber(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `RF-${year}-${random}`;
}

function toDeviceRow(input: DeviceInput) {
  return {
    serial_number: input.serialNumber?.trim() || null,
    imei_1: input.imei1?.trim() || null,
    imei_2: input.imei2?.trim() || null,
    manufacturer: input.manufacturer?.trim() || null,
    model: input.model?.trim() || null,
    device_type: input.deviceType,
    purchase_cost: input.purchaseCost ?? null,
    condition: input.condition || null,
    defect_category: input.defectCategory?.trim() || null,
    defect_description: input.defectDescription?.trim() || null,
    accessories_complete: input.accessoriesComplete ?? null,
    data_erasure_status: input.dataErasureStatus || null,
    inspection_notes: input.inspectionNotes?.trim() || null,
  };
}

export async function getAllDevices(): Promise<Device[]> {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Device[];
}
export async function getDeviceByInternalNumber(
  internalNumber: string,
): Promise<Device | null> {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("internal_number", internalNumber)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Device | null;
}
export async function searchDevices(search: string): Promise<Device[]> {
  const value = search.trim();
  if (!value) return getAllDevices();

  const safeValue = value.replace(/[%_,]/g, " ");
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .or(
      `internal_number.ilike.%${safeValue}%,serial_number.ilike.%${safeValue}%,imei_1.ilike.%${safeValue}%,imei_2.ilike.%${safeValue}%,manufacturer.ilike.%${safeValue}%,model.ilike.%${safeValue}%`,
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Device[];
}

export async function getDevicesByBatch(batchId: string): Promise<Device[]> {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("source_batch_id", batchId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Device[];
}

export async function createDevice(input: {
  sourceBatchId: string;
} & DeviceInput): Promise<Device> {
  const { data, error } = await supabase
    .from("devices")
    .insert({
      internal_number: createInternalNumber(),
      source_batch_id: input.sourceBatchId,
      ...toDeviceRow(input),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Device;
}

export async function updateDevice(
  deviceId: string,
  input: DeviceInput,
): Promise<Device> {
  const { data, error } = await supabase
    .from("devices")
    .update(toDeviceRow(input))
    .eq("id", deviceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Das Gerät wurde nicht aktualisiert.");
  return data as Device;
}

export async function deleteDevice(deviceId: string): Promise<void> {
  const { data, error } = await supabase
    .from("devices")
    .delete()
    .eq("id", deviceId)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error(
      "Gerät wurde nicht gelöscht. Prüfe die DELETE-Policy oder ob das Gerät existiert.",
    );
  }
}

export async function transitionDevice(
  deviceId: string,
  toStatus: DeviceStatus,
  _note?: string,
): Promise<Device> {
  const { data, error } = await supabase
    .from("devices")
    .update({ status: toStatus })
    .eq("id", deviceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Der Gerätestatus wurde nicht geändert.");
  return data as Device;
}
