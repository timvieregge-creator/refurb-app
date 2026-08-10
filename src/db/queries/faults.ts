import { supabase } from "../supabaseClient";

export type FaultSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type DeviceFault = {
  id: string;
  device_id: string;
  category: string;
  code: string;
  description: string | null;
  severity: FaultSeverity;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
};

export async function getFaultsByDevice(deviceId: string) {
  const { data, error } = await supabase
    .from("device_faults")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as DeviceFault[];
}

export async function createDeviceFault(input: {
  deviceId: string;
  category: string;
  code: string;
  description?: string;
  severity: FaultSeverity;
}) {
  const { data, error } = await supabase
    .from("device_faults")
    .insert({
      device_id: input.deviceId,
      category: input.category.trim(),
      code: input.code.trim(),
      description: input.description?.trim() || null,
      severity: input.severity,
      resolved: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as DeviceFault;
}

export async function resolveDeviceFault(
  faultId: string,
  resolved: boolean,
) {
  const { data, error } = await supabase
    .from("device_faults")
    .update({
      resolved,
      resolved_at: resolved ? new Date().toISOString() : null,
    })
    .eq("id", faultId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as DeviceFault;
}