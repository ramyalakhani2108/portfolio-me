import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Search } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const navigate = useNavigate();

  // Animated background gradient
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const floatingVariants = {
    initial: { y: 0 },
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const rotateVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: 360,
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  // Particle animation
  const particleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (i: number) => ({
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      transition: {
        duration: 2,
        delay: i * 0.1,
        repeat: Infinity,
      },
    }),
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />

      {/* Animated background elements */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        variants={floatingVariants}
        initial="initial"
        animate="animate"
      />
      <motion.div
        className="absolute bottom-20 right-10 w-72 h-72 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        variants={floatingVariants}
        initial="initial"
        animate="animate"
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.div
          className="text-center max-w-2xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* 404 Number with animation */}
          <motion.div variants={itemVariants} className="mb-8">
            <motion.div
              className="relative inline-block"
              variants={rotateVariants}
              initial="initial"
              animate="animate"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur opacity-50" />
              <div className="relative bg-background dark:bg-slate-800 rounded-full p-8">
                <span className="text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
                  404
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Page Not Found
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground mb-8"
          >
            Oops! It seems like you've ventured into uncharted territory. The page you're looking for doesn't exist or has been moved.
          </motion.p>

          {/* Search suggestion */}
          <motion.div
            variants={itemVariants}
            className="mb-12 flex items-center justify-center gap-2 text-muted-foreground"
          >
            <Search size={20} />
            <span>Let's get you back on track</span>
          </motion.div>

          {/* Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              onClick={() => navigate("/")}
              size="lg"
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Home size={20} />
              Go Home
            </Button>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <ArrowLeft size={20} />
              Go Back
            </Button>
          </motion.div>

          {/* Floating particles */}
          <motion.div
            variants={itemVariants}
            className="mt-16 flex justify-center gap-8"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                custom={i}
                variants={particleVariants}
                initial="hidden"
                animate="visible"
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Floating navigation breadcrumb */}
      <motion.div
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-muted-foreground z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        Home / 404 Not Found
      </motion.div>
    </div>
  );
};

export default NotFound;
