export type ShippingOption = {
  id: string;
  carrierName: string;
  carrierLogo: string;
  serviceName: string;
  serviceCode: string;
  logisticCode: string;
  carrierId: number;
  deliveryMin: number;
  deliveryMax: number;
  price: number;
  tags: string[];
};
