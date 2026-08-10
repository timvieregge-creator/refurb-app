import { supabase } from "../supabaseClient";

export type SourceBatch = {
  id: string;
  supplier_name: string;
  supplier_reference: string | null;
  lot_number: string | null;
  delivery_note_number: string | null;
  received_at: string;
  quantity: number;
  total_purchase_cost: number;
  transport_cost: number;
  notes: string | null;
  created_at: string;
  updated_at?: string;
};

export type SourceBatchInput = {
  supplierName: string;
  supplierReference?: string;
  lotNumber?: string;
  deliveryNoteNumber?: string;
  receivedAt: string;
  totalPurchaseCost: number;
  transportCost: number;
  notes?: string;
};

function toBatchRow(input: SourceBatchInput) {
  return {
    supplier_name: input.supplierName.trim(),
    supplier_reference: input.supplierReference?.trim() || null,
    lot_number: input.lotNumber?.trim() || null,
    delivery_note_number: input.deliveryNoteNumber?.trim() || null,
    received_at: input.receivedAt,
    total_purchase_cost: input.totalPurchaseCost,
    transport_cost: input.transportCost,
    notes: input.notes?.trim() || null,
  };
}

export async function getSourceBatches(): Promise<SourceBatch[]> {
  const { data, error } = await supabase
    .from("source_batches")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as SourceBatch[];
}

export async function createSourceBatch(
  input: SourceBatchInput,
): Promise<SourceBatch> {
  const { data, error } = await supabase
    .from("source_batches")
    .insert(toBatchRow(input))
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SourceBatch;
}

export async function updateSourceBatch(
  batchId: string,
  input: SourceBatchInput,
): Promise<SourceBatch> {
  const { data, error } = await supabase
    .from("source_batches")
    .update(toBatchRow(input))
    .eq("id", batchId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SourceBatch;
}

export async function deleteSourceBatch(batchId: string): Promise<void> {
  const { data, error } = await supabase
    .from("source_batches")
    .delete()
    .eq("id", batchId)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(
      "Partie wurde nicht gelöscht. Prüfe die DELETE-Policy oder ob die Partie existiert.",
    );
  }
}

export async function getSuppliers(): Promise<string[]> {
  const { data, error } = await supabase
    .from("source_batches")
    .select("supplier_name")
    .not("supplier_name", "is", null)
    .order("supplier_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const suppliers = (data || [])
    .map((batch) => batch.supplier_name)
    .filter(Boolean);

  return [...new Set(suppliers)];
}

export async function getBatchesBySupplier(
  supplierName: string,
): Promise<SourceBatch[]> {
  const { data, error } = await supabase
    .from("source_batches")
    .select("*")
    .eq("supplier_name", supplierName)
    .order("received_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as SourceBatch[];
}