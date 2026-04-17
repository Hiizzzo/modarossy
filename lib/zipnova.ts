import type { ShippingOption } from "./shipping-types";

const BASE_URL = "https://api.zipnova.com.ar/v2";

export const DEFAULT_WEIGHT_GRAMS = 500;
export const DEFAULT_HEIGHT_CM = 10;
export const DEFAULT_WIDTH_CM = 30;
export const DEFAULT_LENGTH_CM = 40;

function buildHeaders(): Record<string, string> {
  const key = process.env.ZIPNOVA_API_KEY;
  const secret = process.env.ZIPNOVA_API_SECRET;
  if (!key || !secret) throw new Error("Faltan credenciales de Zipnova");

  const encoded = Buffer.from(`${key}:${secret}`).toString("base64");
  return {
    Authorization: `Basic ${encoded}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function getAccountId(): number {
  const id = process.env.ZIPNOVA_ACCOUNT_ID;
  if (!id) throw new Error("Falta ZIPNOVA_ACCOUNT_ID");
  return parseInt(id, 10);
}

function getOriginId(): number {
  const id = process.env.ZIPNOVA_ORIGIN_ID;
  if (!id) throw new Error("Falta ZIPNOVA_ORIGIN_ID");
  return parseInt(id, 10);
}

type QuoteItem = {
  weight: number;
  height: number;
  width: number;
  length: number;
  description?: string;
  sku?: string;
};

type QuoteDestination = {
  city: string;
  state: string;
  zipcode: string;
};

export async function quoteShipment(
  destination: QuoteDestination,
  items: QuoteItem[],
  declaredValue: number
): Promise<ShippingOption[]> {
  const res = await fetch(`${BASE_URL}/shipments/quote`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      account_id: getAccountId(),
      origin_id: getOriginId(),
      declared_value: declaredValue,
      type_packaging: "dynamic",
      destination: {
        city: destination.city,
        state: destination.state,
        zipcode: destination.zipcode,
        country: "AR",
      },
      items: items.map((i) => ({
        weight: i.weight,
        height: i.height,
        width: i.width,
        length: i.length,
        description: i.description ?? "",
        sku: i.sku ?? "",
      })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zipnova quote error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const results: unknown[] = data.all_results ?? [];

  return results.map((r: any) => {
    const amounts = r.amounts ?? {};

    return {
      id: `${r.carrier?.id}-${r.service_type?.code}-${r.logistic_type ?? ""}`,
      carrierName: r.carrier?.name ?? "",
      carrierLogo: r.carrier?.logo ?? "",
      serviceName: r.service_type?.name ?? "",
      serviceCode: r.service_type?.code ?? "",
      logisticCode: r.logistic_type ?? "",
      carrierId: r.carrier?.id ?? 0,
      deliveryMin: r.delivery_time?.min ?? 0,
      deliveryMax: r.delivery_time?.max ?? 0,
      price: amounts.price_incl_tax ?? amounts.price ?? 0,
      tags: r.tags ?? [],
    } satisfies ShippingOption;
  });
}

type ShipmentDestination = {
  name: string;
  street: string;
  street_number: string;
  street_extras?: string;
  document: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  zipcode: string;
};

type CreateShipmentParams = {
  logisticCode: string;
  serviceCode: string;
  carrierId: number;
  declaredValue: number;
  externalId: string;
  destination: ShipmentDestination;
  items: QuoteItem[];
};

export async function createShipment(
  params: CreateShipmentParams
): Promise<{ shipmentId: string; trackingCode: string }> {
  const res = await fetch(`${BASE_URL}/shipments`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      account_id: getAccountId(),
      origin_id: getOriginId(),
      logistic_type: params.logisticCode,
      service_type: params.serviceCode,
      carrier_id: params.carrierId,
      declared_value: params.declaredValue,
      external_id: params.externalId,
      type_packaging: "dynamic",
      destination: {
        name: params.destination.name,
        street: params.destination.street,
        street_number: params.destination.street_number,
        street_extras: params.destination.street_extras ?? "",
        document: params.destination.document,
        email: params.destination.email,
        phone: params.destination.phone,
        state: params.destination.state,
        city: params.destination.city,
        zipcode: params.destination.zipcode,
        country: "AR",
      },
      items: params.items.map((i) => ({
        weight: i.weight,
        height: i.height,
        width: i.width,
        length: i.length,
        description: i.description ?? "",
        sku: i.sku ?? "",
      })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zipnova shipment error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return {
    shipmentId: String(data.id ?? ""),
    trackingCode: data.delivery_id ?? data.tracking_id ?? "",
  };
}
