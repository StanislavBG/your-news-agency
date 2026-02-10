import { useGreetings } from "@/hooks/use-greetings";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function Home() {
  const { data: greetings, isLoading, error } = useGreetings();

  const message = greetings && greetings.length > 0 
    ? greetings[0].message 
    : "Hello World";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-blue-50/50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Card className="glass-card max-w-lg w-full p-12 text-center rounded-3xl border-white/50 relative overflow-hidden group">
          
          {/* Decorative background element */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-400/5 rounded-full blur-3xl group-hover:bg-blue-400/10 transition-colors duration-500" />

          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6"
            >
              <span className="text-3xl">👋</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              {isLoading ? (
                <span className="animate-pulse bg-gray-200 text-transparent rounded-lg">Loading...</span>
              ) : (
                message
              )}
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              Welcome to your minimalist starter application. 
              {error && <span className="block mt-2 text-destructive text-sm font-medium">Failed to load custom greeting from API.</span>}
            </p>

            <motion.div 
              className="mt-8 pt-8 border-t border-gray-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <button 
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                onClick={() => window.location.reload()}
              >
                Refresh Message
              </button>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
