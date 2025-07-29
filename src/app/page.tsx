"use client";
import { Button } from "@/components/ui/button"; // Assure-toi que le chemin est correct

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Bienvenue sur Handneedle Store !</h1>
      <Button onClick={() => alert("Bouton cliqué !")}>Cliquez-moi</Button>
      {/* Tu peux supprimer ce bouton après avoir vérifié son affichage */}
    </main>
  );
}
