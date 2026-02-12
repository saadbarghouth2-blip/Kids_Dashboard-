import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import FloatingMapItems from "./components/FloatingMapItems";

export default function HomePage(props: { onStart: () => void }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setStep(1), 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="h-screen w-screen relative z-10 overflow-hidden flex flex-col items-center justify-center p-6 text-center">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-aurora opacity-60 z-0" />
            <div className="absolute inset-0 map-grain z-0" />
            <div className="map-beams mix-blend-overlay opacity-50" />

            {/* Dynamic Map Elements */}
            <FloatingMapItems />

            <div className="relative z-10 max-w-2xl w-full">
                {/* Animated Character */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="mb-8"
                >
                    <div className="map-character text-[100px] lg:text-[140px]">🗺️</div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-4xl lg:text-6xl font-black mb-6 text-ink drop-shadow-sm font-display"
                >
                    رحلة المستكشف الصغير
                </motion.h1>

                {/* Dialogue / Story */}
                <div className="min-h-[120px] mb-8 relative">
                    <AnimatePresence mode="wait">
                        {step === 0 && (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-xl lg:text-2xl text-ink-muted font-bold leading-relaxed bubble-bot p-6 rounded-3xl"
                            >
                                "أهلاً! أنا خريطتك الذكية... جاهز تلف مصر معايا؟"
                            </motion.div>
                        )}
                        {step === 1 && (
                            <motion.div
                                key="story"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xl lg:text-2xl text-ink font-bold leading-relaxed bubble-bot p-6 rounded-3xl shadow-soft border-2 border-[#1f1a15]/10"
                            >
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 1 }}
                                >
                                    هنستكشف الجبال والبحار... 🏔️🌊
                                </motion.span>
                                <br />
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.8, duration: 1 }}
                                >
                                    وهنعرف حكايات عن كل شبر في مصر! 🇪🇬✨
                                </motion.span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Action Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 3.5, type: "spring" }}
                >
                    <button
                        onClick={props.onStart}
                        className="btn-strong text-2xl px-12 py-4 rounded-full hover:scale-105 active:scale-95 shadow-strong group relative overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            يلا نبدأ الرحلة 🚀
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </button>
                </motion.div>
            </div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 4 }}
                className="absolute bottom-6 text-sm font-semibold"
            >
                تم التطوير بواسطة فريق الذكاء الاصطناعي 🤖
            </motion.div>
        </div>
    );
}
