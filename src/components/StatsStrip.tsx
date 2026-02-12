import { motion } from "framer-motion";

export default function StatsStrip(props: { stats: { label: string; value: string; hint?: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {props.stats.map((s, idx) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: idx * 0.06 }}
          className="glass rounded-3xl p-4 shadow-soft relative overflow-hidden scanline"
        >
          <div className="glow-ring" />
          <div className="panel-title">{s.label}</div>
          <div className="text-2xl font-extrabold mt-1 font-display">{s.value}</div>
          {s.hint ? <div className="text-xs text-ink-soft mt-1">{s.hint}</div> : null}
        </motion.div>
      ))}
    </div>
  );
}
