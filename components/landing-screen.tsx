"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  Sparkles, 
  Flame, 
  Gem, 
  Heart, 
  Trophy, 
  ArrowRight, 
  Check, 
  Menu, 
  X, 
  ShieldCheck, 
  BookOpen, 
  HelpCircle,
  Play,
  Star
} from "lucide-react";
import type { UserSchema } from "@insforge/sdk";
import { getInsforgeBrowserClient } from "@/lib/insforge-browser";
import { cn } from "@/lib/utils";

// Companion pets data
const COMPANIONS = [
  {
    name: "Byte",
    title: "The Cyber Pup",
    desc: "Enjoys debugging code and eating bits of data. Perfect for beginner developers.",
    image: "/characters/Byte_1.png",
    evolvedImage: "/characters/Byte.png",
    accent: "bg-[#eef9f0] border-[#3cc74f]/20 text-[#25a53a]",
    color: "#3cc74f"
  },
  {
    name: "Hedge",
    title: "The Prickly Coder",
    desc: "Loves structured logic and optimization. A tough exterior but deep algorithmic core.",
    image: "/characters/Hedge_1.png",
    evolvedImage: "/characters/Hedge.png",
    accent: "bg-[#fff5ea] border-[#f3a850]/20 text-[#c87618]",
    color: "#f3a850"
  },
  {
    name: "Kumo",
    title: "The Cloud Kitty",
    desc: "Dreamy and fluffy, specializes in scalable systems and network engineering.",
    image: "/characters/Kumo_1.png",
    evolvedImage: "/characters/Kumo.png",
    accent: "bg-[#f4f7ff] border-[#5b8cff]/20 text-[#2c5ebd]",
    color: "#5b8cff"
  },
  {
    name: "Milo",
    title: "The Logic Monkey",
    desc: "Full of energy! Loves math puzzles, boolean algebra, and sorting algorithms.",
    image: "/characters/Milo_1.png",
    evolvedImage: "/characters/Milo.png",
    accent: "bg-[#fff2f2] border-[#ff6b6b]/20 text-[#c92a2a]",
    color: "#ff6b6b"
  },
  {
    name: "Nimbus",
    title: "The Wise Storm Owl",
    desc: "Highly intellectual. Guides you through machine learning, AI, and neural networks.",
    image: "/characters/Nimbus_1.png",
    evolvedImage: "/characters/Nimbus.png",
    accent: "bg-[#f9f2ff] border-[#a855f7]/20 text-[#701a75]",
    color: "#a855f7"
  },
  {
    name: "Pip",
    title: "The Scripting Penguin",
    desc: "Playful and fast. A master of Python scripting, data scraping, and automation.",
    image: "/characters/Pip_1.png",
    evolvedImage: "/characters/pip.png",
    accent: "bg-[#e6fcf5] border-[#0ca678]/20 text-[#097959]",
    color: "#0ca678"
  },
  {
    name: "Rexi",
    title: "The Data Dino",
    desc: "Ancient and incredibly robust. Specializes in SQL, big data, and data warehouses.",
    image: "/characters/Rexi_1.png",
    evolvedImage: "/characters/Rexi.png",
    accent: "bg-[#fff9db] border-[#fcc419]/20 text-[#947000]",
    color: "#fcc419"
  },
  {
    name: "Uni",
    title: "The Creative Unicorn",
    desc: "Sparkly and design-oriented. A master of UI/UX, CSS layouts, and frontend art.",
    image: "/characters/Uni_1.png",
    evolvedImage: "/characters/Uni.png",
    accent: "bg-[#fff0f6] border-[#e64980]/20 text-[#a61e4d]",
    color: "#e64980"
  }
];

// FAQS data
const FAQS = [
  {
    question: "What is SkillPet AI?",
    answer: "SkillPet AI is an interactive learning platform that blends gamification with technical education. As you complete lessons in coding, math, and artificial intelligence, your chosen companion pet levels up, earns rewards, and evolves to guide you on more advanced learning quests."
  },
  {
    question: "How does the pet evolution work?",
    answer: "Every time you complete a chapter, answer questions correctly, and maintain your daily streak, you earn Experience Points (XP) and Gems. Once your pet reaches a certain XP threshold, you can use your Gems to trigger their evolution, transforming them from their base avatar into their fully realized evolved forms."
  },
  {
    question: "Can I switch or adopt more than one pet?",
    answer: "When you sign up, you adopt your first base pet for free. As you progress and accumulate gems, you can unlock other companions and choose who joins you on your daily dashboard shell to cheer you on."
  },
  {
    question: "How does the subscription plan work?",
    answer: "Our Free Tier gives you full access to introductory chapters of all courses with a daily limit of 3 hearts. Upgrading to the SkillPet Plus tier (Monthly or Yearly) removes the heart limit entirely, provides unlimited AI-powered hints and review sheets, and grants access to exclusive premium pet skins and achievements."
  },
  {
    question: "How are the courses formatted?",
    answer: "Lessons are designed as bite-sized, interactive chapters containing code editors, multiple choice cards, and AI-powered checkpoints. They are structured to take just 5-10 minutes a day, fitting perfectly into your busy routine."
  }
];

export function LandingScreen() {
  const [currentUser, setCurrentUser] = useState<UserSchema | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [selectedPet, setSelectedPet] = useState(COMPANIONS[0]);
  const [isEvolved, setIsEvolved] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");

  useEffect(() => {
    async function checkSession() {
      try {
        const client = getInsforgeBrowserClient();
        const { data } = await client.auth.getCurrentUser();
        if (data?.user) {
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user session:", error);
      } finally {
        setLoadingSession(false);
      }
    }
    void checkSession();
  }, []);

  async function handleSignOut() {
    try {
      const client = getInsforgeBrowserClient();
      await client.auth.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="relative min-h-screen bg-[#eef4e6] text-[#102312] overflow-x-hidden font-sans selection:bg-[#3cc74f]/30">
      
      {/* Styles for dynamic custom CSS details */}
      <style>{`
        @keyframes floating {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-float {
          animation: floating 6s ease-in-out infinite;
        }
        .grid-bg-landing {
          background-size: 50px 50px;
          background-image: 
            linear-gradient(to right, rgba(16, 35, 18, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 35, 18, 0.03) 1px, transparent 1px);
        }
      `}</style>

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 grid-bg-landing pointer-events-none z-0" />

      {/* Header Navigation */}
      <header className="relative z-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <nav className="flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl px-6 py-4 shadow-[0_8px_30px_rgb(16,35,18,0.03)] transition-all duration-300">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-9 bg-[#3cc74f] rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(60,199,79,0.3)] transition-transform duration-300 group-hover:scale-105">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight text-[#102312]">
              SkillPet <span className="text-[#3cc74f]">AI</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-[#5a705d] hover:text-[#102312] transition-colors">Features</a>
            <a href="#companions" className="text-sm font-semibold text-[#5a705d] hover:text-[#102312] transition-colors">Companions</a>
            <a href="#pricing" className="text-sm font-semibold text-[#5a705d] hover:text-[#102312] transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-semibold text-[#5a705d] hover:text-[#102312] transition-colors">FAQ</a>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {loadingSession ? (
              <div className="h-10 w-24 bg-neutral-200/50 animate-pulse rounded-2xl" />
            ) : currentUser ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-[#3cc74f] text-white font-semibold text-sm rounded-2xl hover:bg-[#25a53a] shadow-[0_8px_20px_-6px_rgba(60,199,79,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-[#102312]/10 text-[#5a705d] hover:text-[#102312] font-semibold text-sm rounded-2xl hover:bg-neutral-50 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-sm font-semibold text-[#5a705d] hover:text-[#102312] px-4 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/login?mode=sign-up" 
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-[#3cc74f] text-white font-semibold text-sm rounded-2xl hover:bg-[#25a53a] shadow-[0_8px_20px_-6px_rgba(60,199,79,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Adopt a Pet Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#102312] hover:bg-black/[0.03] rounded-xl transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Dropdown Nav */}
      {isMobileMenuOpen && (
        <div className="absolute top-24 left-4 right-4 z-40 bg-white border border-[#102312]/10 rounded-3xl p-6 shadow-2xl md:hidden animate-fade-in">
          <div className="flex flex-col gap-5">
            <a 
              href="#features" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-semibold text-[#5a705d] hover:text-[#102312]"
            >
              Features
            </a>
            <a 
              href="#companions" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-semibold text-[#5a705d] hover:text-[#102312]"
            >
              Companions
            </a>
            <a 
              href="#pricing" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-semibold text-[#5a705d] hover:text-[#102312]"
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-semibold text-[#5a705d] hover:text-[#102312]"
            >
              FAQ
            </a>
            <div className="h-px bg-[#102312]/10 w-full my-1" />
            
            {loadingSession ? (
              <div className="h-10 w-full bg-neutral-200/50 animate-pulse rounded-2xl" />
            ) : currentUser ? (
              <div className="flex flex-col gap-3">
                <Link 
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-3 bg-[#3cc74f] text-white font-semibold rounded-2xl"
                >
                  Go to Dashboard
                </Link>
                <button 
                  onClick={() => {
                    void handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-3 bg-neutral-100 hover:bg-neutral-200 text-[#5a705d] font-semibold rounded-2xl transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link 
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-3 bg-neutral-100 hover:bg-neutral-200 text-[#102312] font-semibold rounded-2xl"
                >
                  Sign In
                </Link>
                <Link 
                  href="/login?mode=sign-up"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-3 bg-[#3cc74f] text-white font-semibold rounded-2xl"
                >
                  Adopt a Pet Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left z-10">
              
              <div className="inline-flex items-center gap-2 rounded-full border border-[#3cc74f]/20 bg-[#3cc74f]/8 px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#25a53a]">
                <Flame className="h-4 w-4 animate-pulse" />
                Next-Gen Gamified Learning
              </div>

              <div className="space-y-4">
                <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#102312] leading-[1.05]">
                  Master Tech Skills. <br className="hidden sm:inline" />
                  Evolve Your <span className="text-[#3cc74f] underline decoration-wavy decoration-[#3cc74f]/30 underline-offset-4">AI Companion</span>
                </h1>
                <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-[#5a705d] leading-relaxed">
                  Adopt a customizable AI pet that journeys with you. Maintain streaks, earn gems, and complete hands-on interactive courses on coding, AI, math, and design.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {currentUser ? (
                  <Link 
                    href="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#3cc74f] hover:bg-[#25a53a] text-white font-bold rounded-2xl shadow-[0_12px_30px_-6px_rgba(60,199,79,0.4)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
                  >
                    Enter Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/login?mode=sign-up"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#3cc74f] hover:bg-[#25a53a] text-white font-bold rounded-2xl shadow-[0_12px_30px_-6px_rgba(60,199,79,0.4)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
                    >
                      Adopt Your Pet Free
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link 
                      href="/login"
                      className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white border border-[#102312]/10 hover:border-[#102312]/20 hover:bg-[#fcfdfa] text-[#102312] font-bold rounded-2xl transition-all"
                    >
                      Browse Courses
                    </Link>
                  </>
                )}
              </div>

              {/* Social Proof Stats */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#102312]/10 max-w-md mx-auto lg:mx-0">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-heading text-[#102312]">10k+</p>
                  <p className="text-xs text-[#5a705d]">Active Learners</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-heading text-[#102312]">8</p>
                  <p className="text-xs text-[#5a705d]">Unique Pets</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-heading text-[#102312]">25+</p>
                  <p className="text-xs text-[#5a705d]">Bite-sized Chapters</p>
                </div>
              </div>

            </div>

            {/* Right Evolution Showcase Mockup */}
            <div className="lg:col-span-6 flex justify-center items-center z-10">
              <div className="relative w-full max-w-[480px] aspect-square bg-gradient-to-tr from-[#3cc74f]/10 to-transparent rounded-[2.5rem] p-6 flex flex-col justify-center items-center">
                
                {/* Background glow effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#3cc74f]/15 blur-3xl" />
                
                {/* Decorative floating widgets */}
                <div className="absolute top-6 left-6 bg-white/95 border border-white/50 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2.5 animate-float select-none">
                  <div className="h-8 w-8 rounded-lg bg-[#fff5ea] flex items-center justify-center">
                    <Image src="/streak.png" alt="Streak" width={18} height={18} className="object-contain" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#5a705d] uppercase tracking-wider font-mono">Streak</p>
                    <p className="text-xs font-bold text-[#102312]">12 Days Active</p>
                  </div>
                </div>

                <div className="absolute bottom-10 right-6 bg-white/95 border border-white/50 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2.5 animate-float select-none" style={{ animationDelay: '2s' }}>
                  <div className="h-8 w-8 rounded-lg bg-[#eef9f0] flex items-center justify-center">
                    <Image src="/gems.png" alt="Gems" width={18} height={18} className="object-contain" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#5a705d] uppercase tracking-wider font-mono">Gems Wallet</p>
                    <p className="text-xs font-bold text-[#25a53a]">450 Gems</p>
                  </div>
                </div>

                {/* Main showcase card */}
                <div className="w-full bg-white/90 border border-white/80 rounded-[2rem] p-6 sm:p-8 shadow-[0_20px_50px_rgba(16,35,18,0.06)] backdrop-blur-md relative overflow-hidden flex flex-col items-center">
                  
                  {/* Card top badges */}
                  <div className="w-full flex items-center justify-between border-b border-[#102312]/5 pb-4 mb-6">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest bg-black/[0.03] px-2 py-0.5 rounded border border-[#102312]/5">
                      Pet Evolution Simulator
                    </span>
                  </div>

                  {/* Character Avatar Container */}
                  <div className="relative w-44 h-44 bg-gradient-to-b from-[#eef9f0] to-[#fff] rounded-full border-4 border-white shadow-inner flex items-center justify-center overflow-hidden transition-all duration-300">
                    <Image
                      src={isEvolved ? "/characters/Byte.png" : "/characters/Byte_1.png"}
                      alt="Byte"
                      fill
                      priority
                      className="object-contain p-4 transition-all duration-500 hover:scale-105"
                    />
                  </div>

                  {/* Character details */}
                  <div className="text-center mt-6">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef9f0] px-3 py-1 text-xs font-semibold text-[#2ca949]">
                      <Sparkles className="h-3 w-3" />
                      {isEvolved ? "Evolved Form: Cyber Sentinel" : "Base Form: Byte Pup"}
                    </span>
                    <h4 className="mt-2 text-xl font-bold font-heading text-[#102312]">Byte</h4>
                    <p className="mt-1 text-xs text-[#5a705d] max-w-[280px]">
                      {isEvolved 
                        ? "Has mastered conditional loops and asynchronous states. Ready for production." 
                        : "Learning basic data types and simple operations. Feed him correct answers to level up!"
                      }
                    </p>
                  </div>

                  {/* Toggle Evolve Button CTA */}
                  <button
                    onClick={() => setIsEvolved(!isEvolved)}
                    className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-[#102312] text-white hover:bg-[#3cc74f] font-semibold text-sm rounded-xl transition-all shadow-md group relative overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-[#3cc74f] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0" />
                    <span className="relative z-10 flex items-center gap-2">
                      <Image src="/gems.png" alt="Gems" width={16} height={16} />
                      {isEvolved ? "Revert to Base Form" : "Evolve Pet (Spend 100 Gems)"}
                    </span>
                  </button>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Loop / Features Section */}
      <section id="features" className="py-20 sm:py-28 bg-[#f5f9f0] border-y border-[#102312]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#3cc74f]">How it Works</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#102312]">
              Learning is better with a companion
            </h2>
            <p className="text-base text-[#5a705d]">
              We have dismantled complex technology curricula and rebuilt them into addictively simple, game-driven checkpoints that reward daily effort.
            </p>
          </div>

          {/* Core loop cards grid */}
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="relative bg-white border border-[#102312]/8 p-8 rounded-[2rem] shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-[#eef9f0] flex items-center justify-center text-[#25a53a] font-bold font-mono border border-[#3cc74f]/10 shadow-sm">
                  01
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-heading text-[#102312]">Adopt Your AI Pet</h3>
                  <p className="text-sm text-[#5a705d] leading-relaxed">
                    Pick one of 8 adorable AI companions. Each companion has their own unique personality and area of technical expertise (e.g., frontend, cloud, backend data).
                  </p>
                </div>
              </div>
              <div className="mt-8 border-t border-[#102312]/5 pt-4 flex items-center gap-1.5 text-xs font-semibold text-[#25a53a]">
                Choose your companion pet
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white border border-[#102312]/8 p-8 rounded-[2rem] shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-[#fff5ea] flex items-center justify-center text-[#c87618] font-bold font-mono border border-[#f3a850]/10 shadow-sm">
                  02
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-heading text-[#102312]">Solve Interactive Quests</h3>
                  <p className="text-sm text-[#5a705d] leading-relaxed">
                    Tackle lessons, multiple choice checkpoint cards, and actual programming syntax tasks designed to feel like bite-sized micro-puzzles.
                  </p>
                </div>
              </div>
              <div className="mt-8 border-t border-[#102312]/5 pt-4 flex items-center gap-1.5 text-xs font-semibold text-[#c87618]">
                Earn points and build streaks
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white border border-[#102312]/8 p-8 rounded-[2rem] shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-[#f4f7ff] flex items-center justify-center text-[#2c5ebd] font-bold font-mono border border-[#5b8cff]/10 shadow-sm">
                  03
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-heading text-[#102312]">Unlock Evolution Stages</h3>
                  <p className="text-sm text-[#5a705d] leading-relaxed">
                    As you gain XP and gems, level up your pet and spend gems to trigger structural evolutions. Witness their visual transformation as they learn with you!
                  </p>
                </div>
              </div>
              <div className="mt-8 border-t border-[#102312]/5 pt-4 flex items-center gap-1.5 text-xs font-semibold text-[#2c5ebd]">
                Grow together through coding
              </div>
            </div>

          </div>

          {/* Interactive Feature Panels */}
          <div className="mt-20 border border-white/50 bg-white/60 backdrop-blur rounded-[2.5rem] p-6 sm:p-10 shadow-sm grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#3cc74f] bg-[#eef9f0] px-3.5 py-1.5 rounded-full border border-[#3cc74f]/15">
                App Highlight
              </span>
              <h3 className="font-heading text-3xl font-bold tracking-tight text-[#102312]">
                Stay motivated with a gamified wallet & streaks
              </h3>
              <p className="text-sm leading-relaxed text-[#5a705d]">
                Just like your favorite languages and apps, SkillPet keeps you coming back daily with an elegant status panel. Use gems to purchase premium items, hearts to recover from mistakes, and streaks to prove your consistency.
              </p>
              
              <ul className="space-y-3 pt-2">
                <li className="flex items-center gap-3 text-sm font-medium text-[#102312]">
                  <div className="h-5 w-5 rounded-full bg-[#eef9f0] border border-[#3cc74f]/20 flex items-center justify-center text-[#25a53a]">
                    <Check className="h-3 w-3" />
                  </div>
                  Daily streaks build strong, permanent learning habits
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#102312]">
                  <div className="h-5 w-5 rounded-full bg-[#eef9f0] border border-[#3cc74f]/20 flex items-center justify-center text-[#25a53a]">
                    <Check className="h-3 w-3" />
                  </div>
                  Earn gems and buy exclusive accessories for your pets
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#102312]">
                  <div className="h-5 w-5 rounded-full bg-[#eef9f0] border border-[#3cc74f]/20 flex items-center justify-center text-[#25a53a]">
                    <Check className="h-3 w-3" />
                  </div>
                  Achievements board showcases your programming badges
                </li>
              </ul>
            </div>

            {/* Wallet Illustration Container */}
            <div className="bg-[#eef4e6] border border-[#102312]/5 rounded-[2rem] p-6 sm:p-8 flex flex-col gap-5 select-none relative overflow-hidden">
              <div className="absolute -right-12 -top-12 h-36 w-36 bg-[#3cc74f]/10 rounded-full blur-2xl" />
              
              {/* Wallet header */}
              <div className="flex items-center justify-between">
                <h5 className="font-heading font-bold text-[#102312] text-sm">Dashboard Wallet</h5>
                <span className="text-[10px] font-bold text-[#5a705d] uppercase tracking-wider font-mono">Current Status</span>
              </div>

              {/* Wallet Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-[#102312]/5 rounded-2xl p-4 flex flex-col items-center shadow-sm">
                  <Image src="/gems.png" alt="Gems" width={24} height={24} className="object-contain" />
                  <span className="mt-2 text-base font-bold text-[#102312]">340</span>
                  <span className="text-[9px] font-bold text-[#5a705d] uppercase tracking-wider font-mono">Gems</span>
                </div>
                <div className="bg-white border border-[#102312]/5 rounded-2xl p-4 flex flex-col items-center shadow-sm">
                  <Image src="/heart.png" alt="Hearts" width={24} height={24} className="object-contain" />
                  <span className="mt-2 text-base font-bold text-[#102312]">5 / 5</span>
                  <span className="text-[9px] font-bold text-[#5a705d] uppercase tracking-wider font-mono">Hearts</span>
                </div>
                <div className="bg-white border border-[#102312]/5 rounded-2xl p-4 flex flex-col items-center shadow-sm">
                  <Image src="/streak.png" alt="Streak" width={24} height={24} className="object-contain" />
                  <span className="mt-2 text-base font-bold text-[#102312]">15</span>
                  <span className="text-[9px] font-bold text-[#5a705d] uppercase tracking-wider font-mono">Streak</span>
                </div>
              </div>

              {/* Progress bar info */}
              <div className="bg-white border border-[#102312]/5 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#102312]">Next Level Progress</span>
                  <span className="font-mono text-[#5a705d]">80% (800 / 1000 XP)</span>
                </div>
                <div className="w-full h-3 bg-[#eef4e6] rounded-full overflow-hidden p-[1px]">
                  <div className="h-full bg-gradient-to-r from-[#3cc74f] to-[#25a53a] rounded-full" style={{ width: '80%' }} />
                </div>
                <p className="text-[10px] text-[#5a705d] leading-relaxed">
                  Earn 200 more XP to evolve Byte to Level 2 and unlock custom badges!
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Meet the Companions Showcase */}
      <section id="companions" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#3cc74f]">The Companions</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#102312]">
              Choose your partner in learning
            </h2>
            <p className="text-base text-[#5a705d]">
              Click on any pet to preview their appearance, character traits, and specialties. Meet the cast of characters waiting to support your education!
            </p>
          </div>

          {/* Interactive display */}
          <div className="mt-16 grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left sidebar: Pets list */}
            <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {COMPANIONS.map((pet) => {
                const isSelected = selectedPet.name === pet.name;
                return (
                  <button
                    key={pet.name}
                    onClick={() => {
                      setSelectedPet(pet);
                      setIsEvolved(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.01]",
                      isSelected 
                        ? "bg-white border-[#3cc74f] shadow-md scale-[1.02]" 
                        : "bg-white/50 border-[#102312]/5 hover:bg-white"
                    )}
                  >
                    <div className="relative h-10 w-10 shrink-0 bg-neutral-100 rounded-xl overflow-hidden flex items-center justify-center">
                      <Image src={pet.image} alt={pet.name} fill className="object-contain p-1" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#102312]">{pet.name}</h4>
                      <p className="text-[10px] text-[#5a705d] hidden sm:block truncate max-w-[120px]">{pet.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: Featured Pet Detail card */}
            <div className="lg:col-span-8">
              <div className="bg-white border border-[#102312]/8 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden grid md:grid-cols-2 gap-8 items-center">
                
                {/* Background colored blur matching pet */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: selectedPet.color }} />
                
                {/* Pet Image Frame */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-56 h-56 bg-neutral-50/50 rounded-full border border-neutral-100 flex items-center justify-center overflow-hidden transition-all duration-300">
                    <Image
                      src={isEvolved ? selectedPet.evolvedImage : selectedPet.image}
                      alt={selectedPet.name}
                      fill
                      className="object-contain p-6 transition-all duration-500 animate-float"
                    />
                  </div>
                  
                  {/* Evolution switch */}
                  <div className="inline-flex rounded-full bg-neutral-100 p-1 border border-neutral-200/50">
                    <button
                      onClick={() => setIsEvolved(false)}
                      className={cn(
                        "rounded-full px-4 py-1 text-xs font-semibold transition-all",
                        !isEvolved ? "bg-white text-[#102312] shadow-sm" : "text-[#5a705d] hover:text-[#102312]"
                      )}
                    >
                      Base Avatar
                    </button>
                    <button
                      onClick={() => setIsEvolved(true)}
                      className={cn(
                        "rounded-full px-4 py-1 text-xs font-semibold transition-all",
                        isEvolved ? "bg-white text-[#102312] shadow-sm" : "text-[#5a705d] hover:text-[#102312]"
                      )}
                    >
                      Evolved Avatar
                    </button>
                  </div>
                </div>

                {/* Pet Details */}
                <div className="space-y-6">
                  <div>
                    <span className={cn("inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border", selectedPet.accent)}>
                      <Sparkles className="h-3.5 w-3.5" />
                      {selectedPet.title}
                    </span>
                    <h3 className="mt-3 text-3xl font-bold font-heading text-[#102312]">{selectedPet.name}</h3>
                    <p className="mt-3 text-sm text-[#5a705d] leading-relaxed">
                      {selectedPet.desc}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-[#102312]/5">
                    <p className="text-[10px] font-bold text-[#5a705d] uppercase tracking-wider font-mono">Specialized Courses</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-neutral-100 text-[#102312] border border-neutral-200/50 px-3.5 py-1.5 rounded-full text-xs font-semibold">Intro to Python</span>
                      <span className="bg-neutral-100 text-[#102312] border border-neutral-200/50 px-3.5 py-1.5 rounded-full text-xs font-semibold">Data Structures</span>
                      <span className="bg-neutral-100 text-[#102312] border border-neutral-200/50 px-3.5 py-1.5 rounded-full text-xs font-semibold">SQL Queries</span>
                    </div>
                  </div>

                  <Link
                    href="/login?mode=sign-up"
                    className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-[#3cc74f] hover:bg-[#25a53a] text-white font-bold text-sm rounded-xl transition-all shadow-[0_8px_20px_-6px_rgba(60,199,79,0.3)]"
                  >
                    Adopt {selectedPet.name} Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-28 bg-[#f5f9f0] border-y border-[#102312]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#3cc74f]">Simple Pricing</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#102312]">
              Choose the learning speed that fits you
            </h2>
            <p className="text-base text-[#5a705d]">
              Start for free with standard lessons and daily hearts, or upgrade to Plus to unlock infinite resources and exclusive companions.
            </p>

            {/* Pricing toggle */}
            <div className="pt-6 flex justify-center items-center gap-3">
              <span className={cn("text-sm font-semibold transition-colors", billingPeriod === "monthly" ? "text-[#102312]" : "text-[#5a705d]")}>Monthly</span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
                className="relative h-6 w-11 bg-[#3cc74f] rounded-full p-0.5 transition-colors focus:outline-none"
              >
                <div 
                  className={cn(
                    "h-5 w-5 rounded-full bg-white transition-transform duration-200", 
                    billingPeriod === "yearly" ? "translate-x-5" : "translate-x-0"
                  )} 
                />
              </button>
              <span className={cn("text-sm font-semibold transition-colors flex items-center gap-1.5", billingPeriod === "yearly" ? "text-[#102312]" : "text-[#5a705d]")}>
                Yearly
                <span className="bg-[#3cc74f]/15 border border-[#3cc74f]/20 text-[#25a53a] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                  Save 30%
                </span>
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Free Tier */}
            <article className="bg-white border border-[#102312]/8 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-[#5a705d]">Free Tier</p>
                <div className="mt-4 flex items-baseline">
                  <span className="font-heading text-5xl font-bold text-[#102312]">$0</span>
                  <span className="ml-2 text-sm text-[#5a705d]">/ forever</span>
                </div>
                <p className="mt-4 text-sm text-[#5a705d]">
                  Essential resources for learning basics and adopting your first tech companion.
                </p>

                <ul className="mt-8 space-y-4">
                  <li className="flex items-center gap-3 text-sm text-[#102312]">
                    <div className="h-5 w-5 rounded-full bg-neutral-100 flex items-center justify-center text-[#5a705d]">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    Access to 3 introductory chapters
                  </li>
                  <li className="flex items-center gap-3 text-sm text-[#102312]">
                    <div className="h-5 w-5 rounded-full bg-neutral-100 flex items-center justify-center text-[#5a705d]">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    1 adopted companion pet
                  </li>
                  <li className="flex items-center gap-3 text-sm text-[#102312]">
                    <div className="h-5 w-5 rounded-full bg-neutral-100 flex items-center justify-center text-[#5a705d]">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    3 Daily Hearts (lesson attempts)
                  </li>
                  <li className="flex items-center gap-3 text-sm text-neutral-400 line-through">
                    Unlimited hearts & review quests
                  </li>
                  <li className="flex items-center gap-3 text-sm text-neutral-400 line-through">
                    Exclusive premium pet evolution paths
                  </li>
                </ul>
              </div>

              <Link
                href="/login?mode=sign-up"
                className="mt-8 inline-flex items-center justify-center py-3.5 bg-neutral-100 hover:bg-neutral-200 text-[#102312] font-bold text-sm rounded-2xl transition-colors"
              >
                Start Learning Free
              </Link>
            </article>

            {/* Premium Plus Tier */}
            <article className="bg-white border-2 border-[#3cc74f] p-8 rounded-[2.5rem] shadow-[0_12px_40px_rgba(60,199,79,0.06)] relative overflow-hidden flex flex-col justify-between">
              
              {/* Popular ribbon */}
              <div className="absolute top-0 right-0 bg-[#3cc74f] text-white font-mono text-[9px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl">
                Most Popular
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-[#2ca949] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  SkillPet Plus
                </p>
                <div className="mt-4 flex items-baseline">
                  <span className="font-heading text-5xl font-bold text-[#102312]">
                    {billingPeriod === "monthly" ? "$5.99" : "$4.16"}
                  </span>
                  <span className="ml-2 text-sm text-[#5a705d]">
                    / month {billingPeriod === "yearly" && " (billed annually)"}
                  </span>
                </div>
                <p className="mt-4 text-sm text-[#5a705d]">
                  Unlock the full educational catalog, unlimited daily hearts, and advanced AI evolutions.
                </p>

                <ul className="mt-8 space-y-4">
                  <li className="flex items-center gap-3 text-sm text-[#102312]">
                    <div className="h-5 w-5 rounded-full bg-[#eef9f0] border border-[#3cc74f]/20 flex items-center justify-center text-[#25a53a]">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-semibold">Unlock all courses & chapters</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-[#102312]">
                    <div className="h-5 w-5 rounded-full bg-[#eef9f0] border border-[#3cc74f]/20 flex items-center justify-center text-[#25a53a]">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    Adopt & switch unlimited companion pets
                  </li>
                  <li className="flex items-center gap-3 text-sm text-[#102312]">
                    <div className="h-5 w-5 rounded-full bg-[#eef9f0] border border-[#3cc74f]/20 flex items-center justify-center text-[#25a53a]">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-semibold">Unlimited Hearts & mistakes</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-[#102312]">
                    <div className="h-5 w-5 rounded-full bg-[#eef9f0] border border-[#3cc74f]/20 flex items-center justify-center text-[#25a53a]">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    Exclusive premium pet evolutions & accessories
                  </li>
                  <li className="flex items-center gap-3 text-sm text-[#102312]">
                    <div className="h-5 w-5 rounded-full bg-[#eef9f0] border border-[#3cc74f]/20 flex items-center justify-center text-[#25a53a]">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    AI-powered debugging hints & explanations
                  </li>
                </ul>
              </div>

              <Link
                href="/login?mode=sign-up"
                className="mt-8 inline-flex items-center justify-center py-3.5 bg-[#3cc74f] hover:bg-[#25a53a] text-white font-bold text-sm rounded-2xl shadow-[0_8px_20px_-6px_rgba(60,199,79,0.3)] transition-all duration-200"
              >
                Go Plus Today
              </Link>
            </article>

          </div>
        </div>
      </section>

      {/* Social Proof / Reviews section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#3cc74f]">Testimonials</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#102312]">
              Loved by junior engineers and designers
            </h2>
            <p className="text-base text-[#5a705d]">
              Read how our gamified companions make building technical consistency fun and simple.
            </p>
          </div>

          {/* Testimonial grid */}
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white border border-[#102312]/5 rounded-[2rem] p-6 space-y-5 shadow-sm">
              <div className="flex gap-1 text-[#fcc419]">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4.5 w-4.5 fill-current" />)}
              </div>
              <p className="text-sm leading-relaxed text-[#5a705d]">
                &ldquo;I used to struggle with code syntax drills. Having Milo celebrate when I write correct algorithms makes maintaining my 30-day streak so addictive.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-neutral-100 rounded-full flex items-center justify-center font-bold text-xs text-[#25a53a]">
                  SL
                </div>
                <div>
                  <h6 className="text-xs font-bold text-[#102312]">Sarah Lin</h6>
                  <p className="text-[10px] text-[#5a705d]">Junior Frontend Engineer</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-[#102312]/5 rounded-[2rem] p-6 space-y-5 shadow-sm">
              <div className="flex gap-1 text-[#fcc419]">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4.5 w-4.5 fill-current" />)}
              </div>
              <p className="text-sm leading-relaxed text-[#5a705d]">
                &ldquo;Adopting Kumo helped me scale my API knowledge. The cloud cat evolves when I answer system structure questions, which helps me visualize abstract networking concepts.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-neutral-100 rounded-full flex items-center justify-center font-bold text-xs text-[#2ca949]">
                  MK
                </div>
                <div>
                  <h6 className="text-xs font-bold text-[#102312]">Marcus K.</h6>
                  <p className="text-[10px] text-[#5a705d]">Self-taught Web Developer</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-[#102312]/5 rounded-[2rem] p-6 space-y-5 shadow-sm">
              <div className="flex gap-1 text-[#fcc419]">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4.5 w-4.5 fill-current" />)}
              </div>
              <p className="text-sm leading-relaxed text-[#5a705d]">
                &ldquo;Highly recommend SkillPet Plus! The unlimited hearts mean I can explore buggy solutions and get custom AI diagnostics feedback without feeling discouraged.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-neutral-100 rounded-full flex items-center justify-center font-bold text-xs text-[#c87618]">
                  DB
                </div>
                <div>
                  <h6 className="text-xs font-bold text-[#102312]">Devon Brooks</h6>
                  <p className="text-[10px] text-[#5a705d]">CS Undergraduate Student</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section id="faq" className="py-20 sm:py-28 bg-[#f5f9f0] border-t border-[#102312]/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#3cc74f]">Got Questions?</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#102312]">
              Frequently Asked Questions
            </h2>
          </div>

          {/* Accordion list */}
          <div className="space-y-4">
            {FAQS.map((faq, i) => {
              const isOpen = activeFaq === i;
              return (
                <div 
                  key={i}
                  className="bg-white border border-[#102312]/5 rounded-2xl overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(i)}
                    className="flex justify-between items-center w-full px-6 py-5 font-semibold text-left text-sm sm:text-base text-[#102312] hover:bg-neutral-50/50 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle className="h-4.5 w-4.5 text-[#3cc74f] shrink-0" />
                      {faq.question}
                    </span>
                    <span className="font-mono text-[#5a705d] text-lg shrink-0 ml-4 font-normal">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  <div 
                    className={cn(
                      "transition-all duration-250 ease-in-out border-[#102312]/5 px-6 overflow-hidden text-xs sm:text-sm text-[#5a705d] leading-relaxed",
                      isOpen ? "max-h-48 py-4 border-t" : "max-h-0 py-0"
                    )}
                  >
                    {faq.answer}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#102312]/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-[#3cc74f] rounded-lg flex items-center justify-center text-white font-bold">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <span className="font-heading font-bold text-sm text-[#102312]">
              SkillPet AI
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#5a705d]">
            <a href="#" className="hover:text-[#102312]">Privacy Policy</a>
            <a href="#" className="hover:text-[#102312]">Terms of Service</a>
            <a href="#" className="hover:text-[#102312]">Contact Support</a>
          </div>

          <p className="text-xs text-[#5a705d]">
            &copy; {new Date().getFullYear()} SkillPet AI. All rights reserved.
          </p>

        </div>
      </footer>

    </div>
  );
}
