export default function Loading({ label = 'Carregando...' }) {
  return <div className="flex min-h-52 items-center justify-center text-sm font-semibold text-slate-500">{label}</div>
}
