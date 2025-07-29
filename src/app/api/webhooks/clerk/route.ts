// src/app/api/webhooks/clerk/route.ts
import { Webhook } from "svix"; // Utilisé pour vérifier la signature du webhook
import { headers } from "next/headers"; // Pour accéder aux en-têtes de la requête Next.js
import { WebhookEvent } from "@clerk/nextjs/server"; // Typage des événements Clerk

import dbConnect from "../../../../lib/dbConnect"; // Connexion à ta base de données
import User from "../../../../models/User"; // Ton modèle utilisateur Mongoose

// Cette fonction gérera toutes les requêtes POST vers cet endpoint
export async function POST(req: Request) {
  // 1. Connecte-toi à ta base de données
  await dbConnect();

  // 2. Récupère les en-têtes nécessaires pour la vérification du webhook
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Si les en-têtes Svix sont manquants, c'est une requête invalide
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing Svix headers for webhook verification.");
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // 3. Récupère le corps brut de la requête (nécessaire pour la vérification de la signature)
  const payload = await req.text();
  const body = payload; // Le corps est déjà une chaîne de caractères

  // 4. Récupère le secret du webhook Clerk depuis tes variables d'environnement
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // 5. Crée une nouvelle instance Svix avec ton secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // 6. Vérifie le payload avec les en-têtes pour assurer son authenticité
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // 7. Extrait l'ID de l'utilisateur et le type d'événement
  const { id } = evt.data; // L'ID ici est l'ID utilisateur de Clerk
  const eventType = evt.type; // Ex: 'user.created', 'user.updated', 'user.deleted'

  console.log(`Clerk Webhook Event received: ${eventType} for user ${id}`);

  // 8. Traite l'événement en fonction de son type
  try {
    switch (eventType) {
      case "user.created":
        const clerkUserCreated = evt.data;
        // Mappe les données de l'utilisateur Clerk aux champs de ton modèle Mongoose
        const newUser = {
          _id: clerkUserCreated.id, // IMPORTANT : Utilise l'ID de Clerk comme _id de Mongoose
          username:
            clerkUserCreated.username ||
            clerkUserCreated.email_addresses[0]?.email_address,
          email: clerkUserCreated.email_addresses[0].email_address,
          fullName: clerkUserCreated.first_name || "",
          lastName: clerkUserCreated.last_name || "",
          imageUrl: clerkUserCreated.image_url,
          // Les champs comme addresses, orders, cartItems, usedCoupons seront vides
          // ou leurs valeurs par défaut selon ton schéma, car ils ne viennent pas directement de Clerk.
          // Tu les géreras avec ta propre logique applicative.
        };
        await User.create(newUser);
        console.log(`User created in DB: ${newUser._id}`);
        break;

      case "user.updated":
        const clerkUserUpdated = evt.data;
        // Ne mets à jour que les champs qui sont gérés par Clerk
        // Les champs comme addresses, orders, cartItems, usedCoupons ne devraient pas être écrasés ici.
        const updatedUserData = {
          username:
            clerkUserUpdated.username ||
            clerkUserUpdated.email_addresses[0]?.email_address,
          email: clerkUserUpdated.email_addresses[0].email_address,
          fullName: clerkUserUpdated.first_name || "",
          lastName: clerkUserUpdated.last_name || "",
          imageUrl: clerkUserUpdated.image_url,
        };
        await User.findOneAndUpdate(
          { _id: clerkUserUpdated.id },
          updatedUserData,
          { new: true, runValidators: true }
        );
        console.log(`User updated in DB: ${clerkUserUpdated.id}`);
        break;

      case "user.deleted":
        const clerkUserDeleted = evt.data;
        if (clerkUserDeleted.id) {
          // S'assurer que l'ID existe avant de tenter une suppression
          await User.findOneAndDelete({ _id: clerkUserDeleted.id });
          console.log(`User deleted from DB: ${clerkUserDeleted.id}`);
        } else {
          console.warn(
            "User deletion webhook received without an ID for deletion."
          );
        }
        break;

      default:
        console.warn(`Unhandled Clerk webhook event type: ${eventType}`);
    }
  } catch (dbError) {
    // Gérer les erreurs de base de données (ex: problème de connexion, validation Mongoose)
    console.error(
      `Database error processing ${eventType} for user ${id}:`,
      dbError
    );
    return new Response("Database error processing webhook", { status: 500 });
  }

  // 9. Renvoyer une réponse de succès à Clerk
  return new Response("Webhook received and processed", { status: 200 });
}
