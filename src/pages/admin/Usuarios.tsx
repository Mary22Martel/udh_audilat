import { Check, Copy, Download, KeyRound, ListPlus, MoreVertical, Pencil, Search, Trash2, UserPlus, UserX } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { iniciales } from '../../components/shell/Shell';
import { BotonPrincipal, BotonSecundario, CajaError, Campo, Cargando, Encabezado, Modal, Pagina, Tarjeta, Vacio, estiloCampo, haceCuanto } from '../../components/ui';
import { api, NOMBRE_ROL, type AulaDocente, type Rol, type UsuarioAdmin } from '../../lib/api';
import { useSesion } from '../../lib/sesion';

type Ventana =
  | { tipo: 'nuevo' }
  | { tipo: 'lote' }
  | { tipo: 'editar'; u: UsuarioAdmin }
  | { tipo: 'clave'; u: UsuarioAdmin; clave?: string }
  | { tipo: 'eliminar'; u: UsuarioAdmin }
  | { tipo: 'creado'; nombre: string; correo: string; clave: string }
  | null;

const COLOR_ROL: Record<Rol, string> = {
  admin: 'bg-violet-500/15 text-violet-400',
  docente: 'bg-[var(--c-oro)]/15 text-[var(--c-oro)]',
  estudiante: 'bg-[var(--c-teal)]/15 text-[var(--c-teal)]',
};

function Copiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(texto).then(() => {
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        });
      }}
      className="p-1.5 rounded-md text-[var(--c-suave)] hover:text-[var(--c-texto)] hover:bg-[var(--c-elevado)]"
      aria-label="Copiar"
    >
      {ok ? <Check className="w-4 h-4 text-[var(--c-teal)]" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function descargarCsv(nombre: string, filas: string[][]) {
  const csv = '﻿' + filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function Acciones({ u, esYo, onAccion }: { u: UsuarioAdmin; esYo: boolean; onAccion: (v: Ventana | 'activar') => void }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const f = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAbierto(false);
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, [abierto]);
  const item = 'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-[var(--c-elevado)] rounded-lg';
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setAbierto((v) => !v)} className="p-2 rounded-lg text-[var(--c-suave)] hover:bg-[var(--c-elevado)]" aria-label={`Acciones para ${u.nombre}`}>
        <MoreVertical className="w-4 h-4" />
      </button>
      {abierto && (
        <div className="absolute right-0 mt-1 w-56 p-1.5 bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl shadow-2xl z-40" onClick={() => setAbierto(false)}>
          <button className={item} onClick={() => onAccion({ tipo: 'editar', u })}>
            <Pencil className="w-4 h-4" /> Editar datos
          </button>
          <button className={item} onClick={() => onAccion({ tipo: 'clave', u })}>
            <KeyRound className="w-4 h-4" /> Restablecer contraseña
          </button>
          {!esYo && (
            <>
              <button className={item} onClick={() => onAccion('activar')}>
                <UserX className="w-4 h-4" /> {u.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'}
              </button>
              <button className={`${item} text-rose-400`} onClick={() => onAccion({ tipo: 'eliminar', u })}>
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function FormUsuario({ aulas, inicial, onListo }: { aulas: AulaDocente[]; inicial?: UsuarioAdmin; onListo: (r: { usuario: UsuarioAdmin; clave?: string }) => void }) {
  const [rol, setRol] = useState<Rol>(inicial?.rol ?? 'estudiante');
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [correo, setCorreo] = useState(inicial?.correo ?? '');
  const [codigo, setCodigo] = useState(inicial?.codigo ?? '');
  const [aulaId, setAulaId] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const datos = inicial ? { rol, nombre, correo, codigo: codigo || null } : { rol, nombre, correo, codigo: codigo || null, aulaId: rol === 'estudiante' ? aulaId || null : null };
    try {
      const r = inicial
        ? await api.patch<{ usuario: UsuarioAdmin }>(`/api/admin/usuarios/${inicial.id}`, datos)
        : await api.post<{ usuario: UsuarioAdmin; clave: string }>('/api/admin/usuarios', { ...datos, clave: clave || undefined });
      onListo(r);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid grid-cols-3 gap-2 p-1 bg-[var(--c-fondo)] rounded-xl border border-[var(--c-linea)]">
        {(['estudiante', 'docente', 'admin'] as Rol[]).map((r) => (
          <button type="button" key={r} onClick={() => setRol(r)} className={`py-2 rounded-lg text-sm font-medium ${rol === r ? 'bg-[var(--c-elevado)] text-[var(--c-texto)]' : 'text-[var(--c-suave)]'}`}>
            {NOMBRE_ROL[r]}
          </button>
        ))}
      </div>
      <Campo etiqueta="Nombre completo">
        <input className={estiloCampo} value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={3} placeholder="Valeria Mendoza Quispe" />
      </Campo>
      <Campo etiqueta="Correo" ayuda="Es el usuario con el que ingresará.">
        <input className={estiloCampo} type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required placeholder="2023110482@udh.edu.pe" />
      </Campo>
      {rol === 'estudiante' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo etiqueta="Código (opcional)">
            <input className={estiloCampo} value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="2023110482" />
          </Campo>
          {!inicial ? (
            <Campo etiqueta="Agregar al aula (opcional)">
              <select className={estiloCampo} value={aulaId} onChange={(e) => setAulaId(e.target.value)}>
                <option value="">Ninguna (se une con código)</option>
                {aulas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} · {a.docente}
                  </option>
                ))}
              </select>
            </Campo>
          ) : (
            <span />
          )}
        </div>
      )}
      {!inicial && (
        <Campo etiqueta="Contraseña (opcional)" ayuda="Si la dejas vacía, el sistema genera una fácil de dictar. Mínimo 8 caracteres.">
          <input className={estiloCampo} value={clave} onChange={(e) => setClave(e.target.value)} minLength={8} placeholder="Se genera sola" />
        </Campo>
      )}
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <BotonPrincipal disabled={enviando} className="w-full">
        {enviando ? 'Guardando…' : inicial ? 'Guardar cambios' : 'Crear cuenta'}
      </BotonPrincipal>
    </form>
  );
}

function FormLote({ aulas, onListo }: { aulas: AulaDocente[]; onListo: () => void }) {
  const [rol, setRol] = useState<Rol>('estudiante');
  const [aulaId, setAulaId] = useState(aulas[0]?.id ?? '');
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState<{ creados: { nombre: string; correo: string; clave: string }[]; errores: { linea: number; texto: string; error: string }[] } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lineas = texto.split('\n').filter((l) => l.trim()).length;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const r = await api.post<typeof resultado>('/api/admin/usuarios/lote', { rol, aulaId: rol === 'estudiante' ? aulaId || null : null, texto });
      setResultado(r);
      onListo();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  if (resultado)
    return (
      <div className="space-y-4">
        <p className="text-sm">
          Se {resultado.creados.length === 1 ? 'creó' : 'crearon'} <strong className="text-[var(--c-teal)]">{resultado.creados.length}</strong>{' '}
          {resultado.creados.length === 1 ? 'cuenta' : 'cuentas'}.{' '}
          {resultado.errores.length > 0 && <span className="text-rose-400">{resultado.errores.length} {resultado.errores.length === 1 ? 'línea' : 'líneas'} con error.</span>}
        </p>
        {resultado.creados.length > 0 && (
          <>
            <p className="text-xs text-[var(--c-oro)]">Guarda estas contraseñas ahora: no se vuelven a mostrar. Puedes descargarlas en una hoja de cálculo.</p>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--c-linea)] divide-y divide-[var(--c-linea)]">
              {resultado.creados.map((c) => (
                <div key={c.correo} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium truncate">{c.nombre}</span>
                    <span className="block text-xs text-[var(--c-suave)] truncate">{c.correo}</span>
                  </span>
                  <code className="font-mono text-[var(--c-oro)]">{c.clave}</code>
                </div>
              ))}
            </div>
            <BotonPrincipal
              className="w-full"
              onClick={() => descargarCsv('cuentas-auditlab.csv', [['Nombre', 'Correo', 'Contraseña'], ...resultado.creados.map((c) => [c.nombre, c.correo, c.clave])])}
            >
              <Download className="w-4 h-4" /> Descargar lista con contraseñas
            </BotonPrincipal>
          </>
        )}
        {resultado.errores.length > 0 && (
          <div className="rounded-xl border border-rose-500/30 p-3 space-y-1.5 max-h-40 overflow-y-auto">
            {resultado.errores.map((e) => (
              <p key={e.linea} className="text-xs">
                <span className="text-rose-400 font-semibold">Línea {e.linea}:</span> {e.error} <span className="text-[var(--c-suave)]">«{e.texto}»</span>
              </p>
            ))}
          </div>
        )}
        <BotonSecundario className="w-full" onClick={() => { setResultado(null); setTexto(''); }}>
          Cargar otra lista
        </BotonSecundario>
      </div>
    );

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Campo etiqueta="Tipo de cuenta">
          <select className={estiloCampo} value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
            <option value="estudiante">Estudiantes</option>
            <option value="docente">Docentes</option>
          </select>
        </Campo>
        {rol === 'estudiante' && (
          <Campo etiqueta="Agregar al aula">
            <select className={estiloCampo} value={aulaId} onChange={(e) => setAulaId(e.target.value)}>
              <option value="">Ninguna (se unirán con código)</option>
              {aulas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} · {a.docente}
                </option>
              ))}
            </select>
          </Campo>
        )}
      </div>
      <Campo etiqueta="Lista (una persona por línea)" ayuda="Formato: Nombre completo, correo, código (opcional). Puedes copiar y pegar columnas desde Excel.">
        <textarea
          className={`${estiloCampo} font-mono text-xs min-h-[180px]`}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          required
          placeholder={'Valeria Mendoza Quispe, 2023110482@udh.edu.pe, 2023110482\nDiego Santamaría Ríos, 2023110519@udh.edu.pe, 2023110519'}
        />
      </Campo>
      <p className="text-xs text-[var(--c-suave)]">A cada cuenta se le genera una contraseña. Al terminar podrás descargarlas.</p>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <BotonPrincipal disabled={enviando || !lineas} className="w-full">
        <ListPlus className="w-4 h-4" /> {enviando ? 'Creando…' : `Crear ${lineas || ''} ${lineas === 1 ? 'cuenta' : 'cuentas'}`}
      </BotonPrincipal>
    </form>
  );
}

export function Usuarios() {
  const { usuario: yo } = useSesion();
  const [params, setParams] = useSearchParams();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[] | null>(null);
  const [aulas, setAulas] = useState<AulaDocente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ventana, setVentana] = useState<Ventana>(null);
  const [q, setQ] = useState('');
  const rol = (params.get('rol') as Rol | null) ?? 'todos';
  const filtroAula = params.get('aula') ?? '';

  const cargar = () =>
    api
      .get<{ usuarios: UsuarioAdmin[]; aulas: AulaDocente[] }>('/api/admin/usuarios')
      .then((r) => {
        setUsuarios(r.usuarios);
        setAulas(r.aulas.filter((a) => !a.archivada));
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
  }, []);

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (usuarios ?? []).filter(
      (u) =>
        (rol === 'todos' || u.rol === rol) &&
        (!filtroAula || (filtroAula === 'ninguna' ? u.rol === 'estudiante' && !u.aulas?.length : !!u.aulas?.includes(aulas.find((a) => a.id === filtroAula)?.nombre ?? '\u0000'))) &&
        (!t || u.nombre.toLowerCase().includes(t) || u.correo.includes(t) || (u.codigo ?? '').includes(t))
    );
  }, [usuarios, rol, filtroAula, q, aulas]);

  const filtrar = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  const agregarAula = async (u: UsuarioAdmin, aulaId: string) => {
    if (!aulaId) return;
    await api.post(`/api/admin/usuarios/${u.id}/aula`, { aulaId }).catch((e) => alert(e.message));
    cargar();
  };

  if (error) return <CajaError mensaje={error} onReintentar={cargar} />;
  if (!usuarios) return <Cargando />;

  const cuenta = (r: Rol | 'todos') => (r === 'todos' ? usuarios.length : usuarios.filter((u) => u.rol === r).length);

  return (
    <Pagina>
      <Encabezado
        antetitulo="Administración"
        titulo="Usuarios"
        descripcion="Crea las cuentas, agrégalas a un aula y restablece contraseñas. Los alumnos también pueden unirse a un aula con el código de su docente."
        acciones={
          <>
            <BotonSecundario onClick={() => setVentana({ tipo: 'lote' })}>
              <ListPlus className="w-4 h-4" /> Cargar lista
            </BotonSecundario>
            <BotonPrincipal onClick={() => setVentana({ tipo: 'nuevo' })}>
              <UserPlus className="w-4 h-4" /> Nueva cuenta
            </BotonPrincipal>
          </>
        }
      />

      <Tarjeta className="overflow-visible">
        <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-[var(--c-linea)]">
          <div className="flex items-center gap-1 p-1 bg-[var(--c-fondo)] rounded-xl border border-[var(--c-linea)] overflow-x-auto">
            {(['todos', 'estudiante', 'docente', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => filtrar('rol', r === 'todos' ? '' : r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${rol === r ? 'bg-[var(--c-elevado)] text-[var(--c-texto)]' : 'text-[var(--c-suave)]'}`}
              >
                {r === 'todos' ? 'Todos' : r === 'admin' ? 'Administradores' : `${NOMBRE_ROL[r]}s`} <span className="font-mono-tabular text-xs text-[var(--c-suave)]">{cuenta(r)}</span>
              </button>
            ))}
          </div>
          {(rol === 'estudiante' || rol === 'todos') && (
            <select className={`${estiloCampo} lg:w-64 py-2`} value={filtroAula} onChange={(e) => filtrar('aula', e.target.value)}>
              <option value="">Todas las aulas</option>
              <option value="ninguna">Sin aula</option>
              {aulas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          )}
          <label className="relative lg:ml-auto lg:w-72">
            <Search className="w-4 h-4 text-[var(--c-suave)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nombre, correo o código" className={`${estiloCampo} pl-9 py-2`} />
          </label>
        </div>

        {visibles.length === 0 ? (
          <Vacio icono={UserPlus} titulo="No hay cuentas con ese filtro" texto="Prueba con otro filtro o crea una cuenta nueva." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--c-suave)] border-b border-[var(--c-linea)]">
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold">Aulas</th>
                  <th className="px-4 py-3 font-semibold text-right">Avance</th>
                  <th className="px-4 py-3 font-semibold text-right">Último ingreso</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--c-linea)]">
                {visibles.map((u) => (
                  <tr key={u.id} className={u.activo ? '' : 'opacity-50'}>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-[var(--c-elevado)] flex items-center justify-center text-xs font-bold shrink-0">{iniciales(u.nombre)}</span>
                        <span className="min-w-0">
                          <span className="block font-semibold truncate">
                            {u.nombre} {!u.activo && <span className="text-[10px] font-normal text-rose-400">(desactivada)</span>}
                          </span>
                          <span className="block text-[11px] text-[var(--c-suave)] truncate">
                            {u.correo}
                            {u.codigo && ` · ${u.codigo}`}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${COLOR_ROL[u.rol]}`}>{NOMBRE_ROL[u.rol]}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.rol === 'estudiante' ? (
                        <span className="flex flex-wrap items-center gap-1.5 max-w-[280px]">
                          {(u.aulas ?? []).map((a) => (
                            <span key={a} className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--c-teal)]/12 text-[var(--c-teal)] truncate max-w-[180px]">
                              {a}
                            </span>
                          ))}
                          <select value="" onChange={(e) => agregarAula(u, e.target.value)} className={`text-[11px] py-0.5 px-1.5 rounded-md bg-[var(--c-fondo)] border ${u.aulas?.length ? 'border-[var(--c-linea)]' : 'border-[var(--c-oro)]/60 text-[var(--c-oro)]'}`} aria-label={`Agregar a ${u.nombre} a un aula`}>
                            <option value="">{u.aulas?.length ? '+ aula' : 'Sin aula · agregar'}</option>
                            {aulas.filter((a) => !u.aulas?.includes(a.nombre)).map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.nombre}
                              </option>
                            ))}
                          </select>
                        </span>
                      ) : u.rol === 'docente' ? (
                        <span className="text-xs text-[var(--c-suave)]">
                          {u.aulasDocente} {u.aulasDocente === 1 ? 'aula' : 'aulas'} · {u.alumnos} alumnos
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--c-tenue)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono-tabular whitespace-nowrap">
                      {u.rol === 'estudiante' ? (
                        <>
                          <span className="text-[var(--c-oro)] font-semibold">{u.xp?.toLocaleString('es-PE')} XP</span>
                          <span className="text-[var(--c-suave)]"> · {u.lecciones} lecc. · {u.misiones} casos</span>
                        </>
                      ) : (
                        <span className="text-[var(--c-tenue)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-[var(--c-suave)] whitespace-nowrap">{haceCuanto(u.ultimoAcceso)}</td>
                    <td className="px-2 py-3 text-right">
                      <Acciones
                        u={u}
                        esYo={u.id === yo?.id}
                        onAccion={async (v) => {
                          if (v === 'activar') {
                            await api.patch(`/api/admin/usuarios/${u.id}`, { activo: !u.activo }).catch((e) => alert(e.message));
                            cargar();
                          } else setVentana(v);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      {ventana?.tipo === 'nuevo' && (
        <Modal titulo="Nueva cuenta" onCerrar={() => setVentana(null)}>
          <FormUsuario
            aulas={aulas}
            onListo={(r) => {
              cargar();
              setVentana({ tipo: 'creado', nombre: r.usuario.nombre, correo: r.usuario.correo, clave: r.clave! });
            }}
          />
        </Modal>
      )}
      {ventana?.tipo === 'creado' && (
        <Modal titulo="Cuenta creada" onCerrar={() => setVentana(null)}>
          <div className="space-y-4">
            <p className="text-sm">Entrégale estos datos a <strong>{ventana.nombre}</strong>. La contraseña no se vuelve a mostrar.</p>
            <div className="rounded-xl bg-[var(--c-fondo)] border border-[var(--c-linea)] divide-y divide-[var(--c-linea)]">
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-[var(--c-suave)]">Correo</span>
                <span className="flex items-center gap-1 font-mono">{ventana.correo} <Copiar texto={ventana.correo} /></span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-[var(--c-suave)]">Contraseña</span>
                <span className="flex items-center gap-1 font-mono text-[var(--c-oro)] font-semibold">{ventana.clave} <Copiar texto={ventana.clave} /></span>
              </div>
            </div>
            <BotonSecundario className="w-full" onClick={() => setVentana({ tipo: 'nuevo' })}>
              <UserPlus className="w-4 h-4" /> Crear otra cuenta
            </BotonSecundario>
          </div>
        </Modal>
      )}
      {ventana?.tipo === 'lote' && (
        <Modal titulo="Cargar lista de cuentas" onCerrar={() => setVentana(null)} ancho="max-w-2xl">
          <FormLote aulas={aulas} onListo={cargar} />
        </Modal>
      )}
      {ventana?.tipo === 'editar' && (
        <Modal titulo={`Editar · ${ventana.u.nombre}`} onCerrar={() => setVentana(null)}>
          <FormUsuario
            aulas={aulas}
            inicial={ventana.u}
            onListo={() => {
              cargar();
              setVentana(null);
            }}
          />
        </Modal>
      )}
      {ventana?.tipo === 'clave' && (
        <Modal titulo="Restablecer contraseña" onCerrar={() => setVentana(null)}>
          {ventana.clave ? (
            <div className="space-y-4">
              <p className="text-sm">
                Nueva contraseña de <strong>{ventana.u.nombre}</strong>. Se cerraron sus sesiones abiertas.
              </p>
              <div className="flex items-center justify-between rounded-xl bg-[var(--c-fondo)] border border-[var(--c-linea)] px-4 py-3">
                <code className="font-mono text-lg text-[var(--c-oro)] font-semibold">{ventana.clave}</code>
                <Copiar texto={ventana.clave} />
              </div>
              <BotonPrincipal className="w-full" onClick={() => setVentana(null)}>
                Listo
              </BotonPrincipal>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">
                Se generará una contraseña nueva para <strong>{ventana.u.nombre}</strong> ({ventana.u.correo}). La anterior dejará de funcionar.
              </p>
              <div className="flex gap-3">
                <BotonSecundario className="flex-1" onClick={() => setVentana(null)}>
                  Cancelar
                </BotonSecundario>
                <BotonPrincipal
                  className="flex-1"
                  onClick={async () => {
                    try {
                      const r = await api.post<{ clave: string }>(`/api/admin/usuarios/${ventana.u.id}/clave`);
                      setVentana({ ...ventana, clave: r.clave });
                    } catch (e) {
                      alert((e as Error).message);
                    }
                  }}
                >
                  <KeyRound className="w-4 h-4" /> Generar contraseña
                </BotonPrincipal>
              </div>
            </div>
          )}
        </Modal>
      )}
      {ventana?.tipo === 'eliminar' && (
        <Modal titulo="Eliminar cuenta" onCerrar={() => setVentana(null)}>
          <div className="space-y-4">
            <p className="text-sm">
              ¿Eliminar la cuenta de <strong>{ventana.u.nombre}</strong>? Se borrarán también {ventana.u.rol === 'estudiante' ? 'todos sus intentos y su progreso' : 'sus datos'}. No se puede deshacer.
            </p>
            {ventana.u.rol === 'estudiante' && <p className="text-xs text-[var(--c-suave)]">Si solo quieres que no ingrese, mejor desactiva la cuenta: así se conserva su progreso.</p>}
            <div className="flex gap-3">
              <BotonSecundario className="flex-1" onClick={() => setVentana(null)}>
                Cancelar
              </BotonSecundario>
              <button
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold"
                onClick={async () => {
                  await api.del(`/api/admin/usuarios/${ventana.u.id}`).catch((e) => alert(e.message));
                  setVentana(null);
                  cargar();
                }}
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Pagina>
  );
}
