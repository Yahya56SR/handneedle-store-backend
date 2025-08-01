// src/components/image-upload.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"; // Pour les notifications

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  disabled?: boolean; // Pour désactiver l'input/bouton si nécessaire (ex: pendant la soumission du formulaire)
}

export default function ImageUpload({
  onUploadSuccess,
  disabled = false,
}: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // État de chargement pour l'ajout d'image

  const handleAddImage = () => {
    if (!imageUrl.trim()) {
      toast.error("Veuillez entrer une URL d'image valide.");
      return;
    }

    // Pour l'instant, nous considérons que l'URL est "valide" si elle n'est pas vide.
    // Plus tard, tu pourras ajouter une validation plus poussée (regex pour vérifier le format de l'URL, etc.)

    setLoading(true); // Active le chargement
    try {
      // Simuler un léger délai pour l'opération (comme une API réelle le ferait)
      setTimeout(() => {
        onUploadSuccess(imageUrl.trim());
        setImageUrl(""); // Réinitialise l'input après l'ajout
        toast.success("Image ajoutée avec succès !");
      }, 500); // Délai de 500ms
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'image:", error);
      toast.error("Erreur lors de l'ajout de l'image.");
    } finally {
      setLoading(false); // Désactive le chargement
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="url" // Utilise le type 'url' pour une meilleure validation côté navigateur
        placeholder="Collez l'URL de l'image ici"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        disabled={disabled || loading}
        className="flex-grow" // Prend le maximum d'espace disponible
      />
      <Button
        onClick={handleAddImage}
        disabled={disabled || loading}
        type="button" // Important pour éviter de soumettre le formulaire parent
      >
        {loading ? "Ajout..." : "Ajouter Image"}
      </Button>
    </div>
  );
}
