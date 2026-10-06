"use client";
import { useState } from "react";

const ROLES = [
  { value: "ADMIN", label: "Administrador" },
  { value: "OPERADOR_PLANTA", label: "Operador de Planta" },
  { value: "OPERADOR_BUQUE", label: "Operador de Buque" },
  { value: "OPERADOR_LANCHA", label: "Operador de Lancha" },
] as const;

export default function CrearUsuarioForm({ onCreado }: { onCreado?: () => void }) {
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [rol, setRol] = useState<string>("OPERADOR_PLANTA");
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!nombre.trim() || !dni.trim() || !contrasena.trim()) {
      setMsg({ tipo: "error", texto: "Completá nombre, DNI y contraseña." });
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          dni: Number(dni),
          contrasena,
          rol,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMsg({ tipo: "ok", texto: `Usuario creado (id ${data.id}).` });
        setNombre(""); setDni(""); setContrasena(""); setRol("OPERADOR_PLANTA");
        onCreado?.(); // para recargar la tabla cuando la tengas
      } else {
        const code = data?.error?.code;
        const texto =
          code === "DNI_YA_REGISTRADO" ? "Ya existe un usuario con ese DNI."
          : data?.error?.message ?? "No se pudo crear el usuario.";
        setMsg({ tipo: "error", texto });
      }
    } catch {
      setMsg({ tipo: "error", texto: "Error de conexión con el servidor." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      <h2 className="text-lg font-semibold">Crear usuario</h2>

      <label className="flex flex-col gap-1 text-sm">
        Nombre
        <input
          className="border rounded px-3 py-2"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        DNI
        <input
          type="number"
          className="border rounded px-3 py-2"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Contraseña
        <input
          type="password"
          className="border rounded px-3 py-2"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Rol
        <select
          className="border rounded px-3 py-2"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {enviando ? "Creando..." : "Crear usuario"}
      </button>

      {msg && (
        <p className={msg.tipo === "ok" ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
          {msg.texto}
        </p>
      )}
    </form>
  );
}