"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else window.location.href = "/admin";
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 rounded-2xl bg-white p-8 ring-1 ring-celeste-100">
      <h1 className="text-2xl font-semibold">Panel Rossi</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 w-full rounded-full border border-celeste-200 px-4 text-sm"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="h-11 w-full rounded-full border border-celeste-200 px-4 text-sm"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button className="btn-primary w-full">Entrar</button>
    </form>
  );
}
