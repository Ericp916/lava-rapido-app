export default function EmptyState({ title, text }) {
  return <div className="card py-10 text-center"><p className="font-bold text-slate-700">{title}</p>{text && <p className="mt-1 text-sm text-slate-500">{text}</p>}</div>
}
