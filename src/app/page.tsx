"use client";
import { useSession } from "@clerk/clerk-react";
export default function Home() {
  const { session, isLoaded } = useSession();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>No session yet</div>;
  }

  return <div>Session ID: {session.id}</div>;
}
