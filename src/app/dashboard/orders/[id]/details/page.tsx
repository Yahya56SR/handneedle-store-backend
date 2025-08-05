/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Interfaces pour les données de commande
interface Product {
  _id: string;
  name: string;
  mediaUrls: string[];
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  variantDetails?: Record<string, string>;
}

interface OrderData {
  _id: string;
  totalAmount: number;
  orderStatus: string;
  items: Record<string, OrderItem>;
  products: Product[]; // L'array peuplé de produits
  shippingAddress: any; // Utilisation de 'any' pour la simplicité
  billingAdress: any;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch order details.");
        }
        const data = await response.json();
        setOrder(data.data);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!order) {
    return <div className="p-6">Order not found.</div>;
  }

  // Créer un objet pour un accès facile aux données des produits
  const productMap = new Map(order.products.map((p) => [p._id, p]));

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Détails de la Commande #{order._id.slice(-6)}</CardTitle>
          <Badge>{order.orderStatus}</Badge>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex justify-between items-center text-sm">
            <span>Montant total:</span>
            <span className="font-semibold">
              {order.totalAmount.toFixed(2)}€
            </span>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-2">Articles commandés</h3>
            <div className="space-y-4">
              {Object.entries(order.items).map(([sku, item]) => {
                const product = productMap.get(item.productId);
                return (
                  <div key={sku} className="flex items-center space-x-4">
                    <div className="relative w-20 h-20 rounded-md overflow-hidden shrink-0">
                      <Image
                        src={product?.mediaUrls[0] || "/placeholder-image.jpg"}
                        alt={product?.name || "Product image"}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-500">
                        Quantité: {item.quantity}
                      </p>
                      <p className="text-sm text-gray-500">
                        Prix unitaire: {item.pricePerUnit.toFixed(2)}€
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-2">Adresse de livraison</h3>
            <p>{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.zip}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
