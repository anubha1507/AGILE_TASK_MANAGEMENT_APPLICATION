import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Layout, Zap, Users, CheckCircle2, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import FancyButton from "../components/FancyButton";
import LoginButton from "../components/LoginButton";
import WordRotator from "../components/WordRotator";
import Pattern from "../components/Pattern";

export function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen relative text-neutral-50 font-sans selection:bg-orange-200/30">
      {/* Animated Pattern Background */}
      <Pattern />
      {/* Dark overlay so text is readable over the pattern */}
      <div className="fixed inset-0 z-[1] bg-black/60 pointer-events-none" />
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">▲</span>
            </div>
            <span className="font-semibold tracking-tight text-white">AgileFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          </div>
          <div className="flex items-center gap-4">
            <LoginButton />
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative z-10 pt-36 pb-24 px-6 max-w-7xl mx-auto text-center">


          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1] text-white"
          >
            Master your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">task management</span>{" "}
            with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">efficient</span>{" "}
            workflows.
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-10"
          >
            <WordRotator />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            The minimal, powerful project management tool designed for modern agile teams. Say goodbye to clutter and hello to focus.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex items-center justify-center"
          >
            <FancyButton />
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="relative z-10 py-24 bg-black/40 backdrop-blur-sm border-y border-white/10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto px-6"
          >
            <div className="mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-white">Everything you need to ship.</h2>
              <p className="text-white/50">Powerful features wrapped in a beautiful, minimal interface.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Layout, title: "Custom Kanban Boards", desc: "Visualize your workflow with flexible, drag-and-drop boards." },
                { icon: Zap, title: "Lightning Fast", desc: "Built for speed. Keyboard shortcuts for every action." },
                { icon: Users, title: "Real-time Collab", desc: "See who's working on what. Multiplayer built-in." }
              ].map((f, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-orange-500/40 hover:bg-white/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4 group-hover:bg-orange-500/30 transition-colors">
                    <f.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
        {/* How it Works */}
        <section id="how-it-works" className="relative z-10 py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl font-bold tracking-tight mb-4 text-white">How it Works</h2>
              <p className="text-white/50 max-w-2xl mx-auto">Discover our process with a full 360° spin. Hover over each step to learn more.</p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-12 relative">
              {[
                { step: "STEP-1", title: "Create Your Project", desc: "Set up your workspace, invite your team, and define your first goals." },
                { step: "STEP-2", title: "Manage Tasks", desc: "Break down goals into actionable tasks on our intuitive Kanban boards." },
                { step: "STEP-3", title: "Ship & Iterate", desc: "Track progress in real-time and deliver high-quality software faster." }
              ].map((s, i) => (
                <div key={i} className="group h-[350px] [perspective:1000px]">
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.2 }}
                    whileHover={{ rotateY: 360 }}
                    className="relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-xl overflow-hidden cursor-pointer hover:border-orange-500/40"
                  >
                    {/* Front Face - Number (Visible initially) */}
                    <motion.div 
                      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-10"
                      variants={{
                        initial: { opacity: 1 },
                        hover: { opacity: 0 }
                      }}
                      initial="initial"
                      animate="initial"
                      whileHover="hover"
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-yellow-400 text-white flex items-center justify-center text-3xl font-black mb-6 shadow-2xl shadow-orange-500/30">
                        {s.step.split("-")[1]}
                      </div>
                      <h4 className="text-sm font-black tracking-widest text-orange-400 uppercase">{s.step}</h4>
                    </motion.div>
                    
                    {/* Content Layer (Fades in during spin) */}
                    <motion.div 
                      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-center p-8 bg-neutral-900 dark:bg-white text-white dark:text-black"
                      variants={{
                        initial: { opacity: 0, scale: 0.8 },
                        hover: { opacity: 1, scale: 1 }
                      }}
                      initial="initial"
                      animate="initial"
                      whileHover="hover"
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <h4 className="text-xs font-black tracking-widest text-blue-400 dark:text-blue-600 mb-2 uppercase">{s.step}</h4>
                      <h3 className="text-2xl font-bold mb-4">{s.title}</h3>
                      <p className="opacity-80 dark:opacity-60 leading-relaxed text-sm">{s.desc}</p>
                    </motion.div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-12 border-t border-white/10 text-center">
        <p className="text-white/40 text-sm">© 2026 AgileFlow Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
