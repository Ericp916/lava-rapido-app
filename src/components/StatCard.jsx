export default function StatCard({ label, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-800',
    green: 'bg-emerald-50 text-emerald-800',
    amber: 'bg-amber-50 text-amber-800',
  }
  return <div className={`rounded-3xl p-4 ${tones[tone]}`}><p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p><p className="mt-2 text-xl font-black tracking-tight">{value}</p></div>
}
