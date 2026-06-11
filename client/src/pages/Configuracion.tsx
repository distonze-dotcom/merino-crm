import { useRef, useState, useCallback, DragEvent, ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { C, fmtDate } from "../components/design/tokens";
import { SectionHeader } from "../components/design/SectionHeader";
import { Avatar } from "../components/design/Avatar";
import { importProducts, getProductStats } from "../api/products";
import { getUsers, createUser, User } from "../api/users";

// ─── helpers ────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: "14px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <div style={{ color: color ?? C.accent, fontSize: 22, fontWeight: 800 }}>{value}</div>
      <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
    </div>
  );
}

// ─── Preview table (first 5 rows) ───────────────────────────────────────────

interface PreviewRow {
  CODIGO_PRO: string;
  DETALLE: string;
  MARCA: string;
  UNID: string | number;
  UNI_MED: string;
  "REVENTA SIN IVA": number;
}

function PreviewTable({ rows }: { rows: PreviewRow[] }) {
  const cols: (keyof PreviewRow)[] = ["CODIGO_PRO", "DETALLE", "MARCA", "UNID", "UNI_MED", "REVENTA SIN IVA"];
  const labels: Record<string, string> = { CODIGO_PRO: "CODIGO", DETALLE: "DETALLE", MARCA: "MARCA", UNID: "UNID", UNI_MED: "UNI_MED", "REVENTA SIN IVA": "REVENTA SIN IVA" };
  return (
    <div style={{ overflowX: "auto", marginTop: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c} style={{
                color: C.muted,
                textAlign: "left",
                padding: "6px 10px",
                borderBottom: `1px solid ${C.border}`,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                whiteSpace: "nowrap",
              }}>{labels[c as string] ?? c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : C.surface }}>
              {cols.map((c) => (
                <td key={c} style={{
                  color: C.text,
                  padding: "5px 10px",
                  borderBottom: `1px solid ${C.border}`,
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>{String(r[c] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── New User Modal ──────────────────────────────────────────────────────────

const PRESET_COLORS = ["#e8541a", "#3b82f6", "#22c55e", "#a78bfa", "#f59e0b", "#ef4444", "#06b6d4"];

function NewUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    color: PRESET_COLORS[0],
    role: "SALES" as "ADMIN" | "SALES",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.name || !form.email || !form.password) {
      setError("Completá todos los campos obligatorios");
      return;
    }
    setLoading(true);
    try {
      await createUser({ ...form, avatar: initials(form.name) });
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.text,
    padding: "9px 12px",
    fontSize: 13,
    width: "100%",
    outline: "none",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: 28,
        width: 400,
        maxWidth: "90vw",
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: C.text, fontSize: 15, fontWeight: 800, margin: "0 0 20px" }}>Nuevo Usuario</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ color: C.muted, fontSize: 11, display: "block", marginBottom: 4 }}>NOMBRE *</label>
            <input style={inputStyle} value={form.name} onChange={set("name")} placeholder="Juan Pérez" />
          </div>
          <div>
            <label style={{ color: C.muted, fontSize: 11, display: "block", marginBottom: 4 }}>EMAIL *</label>
            <input style={inputStyle} value={form.email} onChange={set("email")} type="email" placeholder="juan@ejemplo.com" />
          </div>
          <div>
            <label style={{ color: C.muted, fontSize: 11, display: "block", marginBottom: 4 }}>CONTRASEÑA *</label>
            <input style={inputStyle} value={form.password} onChange={set("password")} type="password" placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label style={{ color: C.muted, fontSize: 11, display: "block", marginBottom: 6 }}>COLOR</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {PRESET_COLORS.map((c) => (
                <div key={c} onClick={() => setForm((f) => ({ ...f, color: c }))} style={{
                  width: 26, height: 26, borderRadius: "50%", background: c, cursor: "pointer",
                  border: form.color === c ? "2px solid #fff" : "2px solid transparent",
                  boxShadow: form.color === c ? `0 0 0 2px ${c}` : "none",
                }} />
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
                <Avatar avatar={initials(form.name || "?")} color={form.color} size={28} />
              </div>
            </div>
          </div>
          <div>
            <label style={{ color: C.muted, fontSize: 11, display: "block", marginBottom: 4 }}>ROL</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.role} onChange={set("role")}>
              <option value="SALES">Comercial</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 12, background: C.redDim, border: `1px solid ${C.red}`, borderRadius: 8, padding: "8px 12px", color: C.red, fontSize: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            background: "transparent", border: `1px solid ${C.border}`,
            color: C.muted, borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer",
          }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            background: C.accent, border: "none", color: "#fff",
            borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}>{loading ? "Guardando..." : "Crear Usuario"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Configuracion() {
  const qc = useQueryClient();

  // Stats
  const { data: statsData } = useQuery({
    queryKey: ["product-stats"],
    queryFn: getProductStats,
  });

  // Users
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  // File / drag state
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [result, setResult] = useState<{ imported: number; updated: number; skipped: number; errors: string[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [listType, setListType] = useState<"reventa" | "general">("reventa");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: (f: File) => importProducts(f, listType),
    onSuccess: (data) => {
      setResult(data);
      setImportError(null);
      qc.invalidateQueries({ queryKey: ["product-stats"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setImportError(msg ?? "Error al importar productos");
    },
  });

  const loadPreview = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
        const norm = (v: unknown) => String(v ?? "").trim().toUpperCase().replace(/\s+/g, " ");

        // Locate the header row (file may have a title row above it)
        let headerIdx = -1;
        for (let i = 0; i < matrix.length; i++) {
          const cells = (matrix[i] || []).map(norm);
          if (cells.includes("CODIGO") && cells.includes("DETALLE")) { headerIdx = i; break; }
        }
        if (headerIdx === -1) { setPreview([]); return; }

        const header = (matrix[headerIdx] || []).map(norm);
        const findCol = (...names: string[]) => header.findIndex((h) => names.some((n) => h === n || h.includes(n)));
        const cCodigo = findCol("CODIGO");
        const cDetalle = findCol("DETALLE");
        const cMarca = findCol("MARCA");
        const cUnid = header.findIndex((h) => h === "UNID");
        const cUniMed = findCol("UNI_MED", "UNI MED", "UNIDAD MEDIDA");
        const cPrecio = findCol("REVENTA SIN IVA", "REVENTA");

        const out: PreviewRow[] = [];
        for (let i = headerIdx + 1; i < matrix.length && out.length < 5; i++) {
          const r = matrix[i] || [];
          const codigo = String(r[cCodigo] ?? "").trim();
          const detalle = String(r[cDetalle] ?? "").trim();
          if (!codigo || !detalle) continue;
          out.push({
            CODIGO_PRO: codigo,
            DETALLE: detalle,
            MARCA: cMarca >= 0 ? String(r[cMarca] ?? "") : "",
            UNID: cUnid >= 0 ? String(r[cUnid] ?? "") : "",
            UNI_MED: cUniMed >= 0 ? String(r[cUniMed] ?? "") : "",
            "REVENTA SIN IVA": cPrecio >= 0 ? Number(r[cPrecio]) || 0 : 0,
          });
        }
        setPreview(out);
      } catch {
        setPreview([]);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setImportError(null);
    loadPreview(f);
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
      handleFile(f);
    }
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  // New user modal
  const [showNewUser, setShowNewUser] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <SectionHeader title="Configuración" sub="Importación de productos y gestión de usuarios" />

      {/* ── Section 1: Import ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
        <h2 style={{ color: C.text, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 4px" }}>
          Importar Lista de Precios
        </h2>
        <p style={{ color: C.muted, fontSize: 12, margin: "0 0 16px" }}>
          Subí un archivo Excel (.xlsx) con columnas: CODIGO, DETALLE, MARCA, UNID, UNI_MED y la columna de precio.
        </p>

        {/* List type selector */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>¿Qué lista estás subiendo?</div>
          <div style={{ display: "flex", gap: 8, maxWidth: 360 }}>
            {([["reventa", "Lista Reventa"], ["general", "Lista General"]] as const).map(([val, label]) => (
              <button key={val} type="button" onClick={() => setListType(val)} style={{
                flex: 1, padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700,
                background: listType === val ? C.accentDim : C.surface,
                color: listType === val ? C.accent : C.muted,
                border: `1px solid ${listType === val ? C.accent : C.border}`,
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          <StatBox label="Productos totales" value={statsData?.total ?? "—"} color={C.blue} />
          <StatBox label="Marcas" value={statsData?.brands.length ?? "—"} color={C.purple} />
          <StatBox
            label="Última importación"
            value={statsData?.lastImport ? fmtDate(statsData.lastImport) : "Nunca"}
            color={C.green}
          />
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? C.accent : C.border}`,
            borderRadius: 8,
            padding: "32px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? `${C.accent}12` : C.surface,
            transition: "all 0.2s",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
          {file ? (
            <div>
              <div style={{ color: C.accent, fontWeight: 700, fontSize: 14 }}>{file.name}</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
                {(file.size / 1024).toFixed(1)} KB · Listo para importar
              </div>
            </div>
          ) : (
            <div>
              <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Arrastrá tu archivo aquí</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>o hacé clic para seleccionar · .xlsx / .xls</div>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleInputChange}
          style={{ display: "none" }}
        />

        {/* Preview */}
        {preview.length > 0 && !result && (
          <div style={{ marginTop: 16 }}>
            <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
              Vista previa — primeras {preview.length} filas
            </div>
            <PreviewTable rows={preview} />
          </div>
        )}

        {/* Import button */}
        {file && !result && (
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => importMutation.mutate(file)}
              disabled={importMutation.isPending}
              style={{
                background: C.accent,
                border: "none",
                color: "#fff",
                borderRadius: 8,
                padding: "11px 28px",
                fontSize: 14,
                fontWeight: 700,
                cursor: importMutation.isPending ? "not-allowed" : "pointer",
                opacity: importMutation.isPending ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {importMutation.isPending ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                  Importando...
                </>
              ) : "Importar productos"}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{
            marginTop: 16,
            background: C.greenDim,
            border: `1px solid ${C.green}`,
            borderRadius: 8,
            padding: "14px 18px",
          }}>
            <div style={{ color: C.green, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
              ✅ Importación completada
            </div>
            <div style={{ color: C.text, fontSize: 13 }}>
              <span style={{ color: C.green }}>+{result.imported}</span> productos nuevos,{" "}
              <span style={{ color: C.blue }}>{result.updated}</span> actualizados,{" "}
              <span style={{ color: C.muted }}>{result.skipped}</span> omitidos
            </div>
            {result.errors.length > 0 && (
              <div style={{ marginTop: 8, color: C.red, fontSize: 11 }}>
                {result.errors.slice(0, 5).map((e, i) => <div key={i}>⚠ {e}</div>)}
                {result.errors.length > 5 && <div>…y {result.errors.length - 5} errores más</div>}
              </div>
            )}
            <button
              onClick={() => { setFile(null); setResult(null); setPreview([]); }}
              style={{
                marginTop: 10,
                background: "transparent",
                border: `1px solid ${C.border}`,
                color: C.muted,
                borderRadius: 8,
                padding: "4px 12px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >Importar otro archivo</button>
          </div>
        )}

        {/* Import error */}
        {importError && (
          <div style={{
            marginTop: 16,
            background: C.redDim,
            border: `1px solid ${C.red}`,
            borderRadius: 8,
            padding: "12px 16px",
            color: C.red,
            fontSize: 13,
          }}>
            ❌ {importError}
          </div>
        )}
      </div>

      {/* ── Section 2: Users ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ color: C.text, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, margin: 0 }}>
              Gestión de Usuarios
            </h2>
            <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{users.length} usuarios registrados</div>
          </div>
          <button
            onClick={() => setShowNewUser(true)}
            style={{
              background: C.accent,
              border: "none",
              color: "#fff",
              borderRadius: 8,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            + Nuevo Usuario
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {users.map((u: User) => (
            <div key={u.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 16px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
            }}>
              <Avatar avatar={u.avatar} color={u.color} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{u.name}</div>
                <div style={{ color: C.muted, fontSize: 11 }}>{u.email}</div>
              </div>
              <div style={{
                background: u.role === "ADMIN" ? `${C.accent}22` : C.blueDim,
                color: u.role === "ADMIN" ? C.accent : C.blue,
                border: `1px solid ${u.role === "ADMIN" ? C.accentDim : C.blue}`,
                borderRadius: 8,
                padding: "2px 10px",
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}>
                {u.role === "ADMIN" ? "Admin" : "Comercial"}
              </div>
              {!u.active && (
                <div style={{
                  background: C.redDim,
                  color: C.red,
                  border: `1px solid ${C.red}`,
                  borderRadius: 8,
                  padding: "2px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                }}>Inactivo</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showNewUser && (
        <NewUserModal
          onClose={() => setShowNewUser(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["users"] })}
        />
      )}
    </div>
  );
}
