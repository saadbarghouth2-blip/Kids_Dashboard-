import { motion } from "framer-motion";

const ICONS = [
    { icon: "🌍", x: "10%", y: "20%", size: "4rem", duration: 8, delay: 0 },
    { icon: "🧭", x: "85%", y: "15%", size: "5rem", duration: 9, delay: 1 },
    { icon: "🗺️", x: "15%", y: "75%", size: "4.5rem", duration: 10, delay: 2 },
    { icon: "📍", x: "80%", y: "65%", size: "3.5rem", duration: 7, delay: 0.5 },
    { icon: "🏔️", x: "25%", y: "10%", size: "3rem", duration: 11, delay: 3 },
    { icon: "🏰", x: "70%", y: "85%", size: "3.5rem", duration: 12, delay: 1.5 },
    { icon: "🛥️", x: "5%", y: "45%", size: "3rem", duration: 15, delay: 4 },
    { icon: "🏜️", x: "90%", y: "40%", size: "3rem", duration: 13, delay: 2.5 },
    { icon: "🚂", x: "40%", y: "90%", size: "3rem", duration: 14, delay: 0 },
    { icon: "🔭", x: "60%", y: "5%", size: "3rem", duration: 10, delay: 3.5 },
    { icon: "⚓", x: "95%", y: "80%", size: "3rem", duration: 9, delay: 1 },
    { icon: "⛺", x: "10%", y: "90%", size: "2.5rem", duration: 11, delay: 5 },
];

export default function FloatingMapItems() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5">
            {ICONS.map((item, i) => (
                <motion.div
                    key={i}
                    className="absolute opacity-40 blur-[1px] select-none"
                    style={{
                        left: item.x,
                        top: item.y,
                        fontSize: item.size,
                        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))"
                    }}
                    animate={{
                        y: [0, -30, 0],
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: item.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: item.delay
                    }}
                >
                    {item.icon}
                </motion.div>
            ))}

            {/* Moving Clouds Layer 1 */}
            <motion.div
                initial={{ x: -200 }}
                animate={{ x: "120vw" }}
                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                className="absolute top-20 text-8xl opacity-50 blur-[2px]"
            >
                ☁️
            </motion.div>

            {/* Moving Clouds Layer 2 */}
            <motion.div
                initial={{ x: -250 }}
                animate={{ x: "120vw" }}
                transition={{ duration: 65, repeat: Infinity, ease: "linear", delay: 10 }}
                className="absolute top-60 text-7xl opacity-40 blur-[1px]"
            >
                ☁️
            </motion.div>

            {/* Flying Plane */}
            <motion.div
                initial={{ x: -200, y: 300 }}
                animate={{ x: "120vw", y: -100 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear", repeatDelay: 8 }}
                className="absolute top-1/2 text-6xl opacity-70 rotate-12 drop-shadow-lg"
            >
                ✈️
            </motion.div>
        </div>
    );
}
