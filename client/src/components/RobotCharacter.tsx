import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RobotCharacterProps {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export default function RobotCharacter({ size = "lg", animate = true }: RobotCharacterProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-20 h-20", 
    lg: "w-32 h-32"
  };

  const faceSizes = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const eyeSizes = {
    sm: "w-1 h-1",
    md: "w-2 h-2", 
    lg: "w-3 h-3"
  };

  const armSizes = {
    sm: "w-2 h-4",
    md: "w-3 h-6",
    lg: "w-4 h-8"
  };

  const robotContainer = (
    <div className={cn(
      "bg-gradient-to-br from-accent/20 to-secondary/20 rounded-full flex items-center justify-center relative",
      sizeClasses[size],
      animate && "robot-float"
    )}>
      <div className={cn(
        "bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center relative",
        size === "sm" ? "w-8 h-8" : size === "md" ? "w-16 h-16" : "w-24 h-24"
      )}>
        {/* Robot Face */}
        <div className={cn(
          "bg-white rounded-full flex items-center justify-center relative",
          faceSizes[size]
        )}>
          {/* Eyes */}
          <div className="flex space-x-1">
            <div className={cn("bg-primary rounded-full", eyeSizes[size])} />
            <div className={cn("bg-primary rounded-full", eyeSizes[size])} />
          </div>
          {/* Smile */}
          <div className={cn(
            "absolute border-b-2 border-primary rounded-full",
            size === "sm" ? "bottom-0.5 left-1/2 transform -translate-x-1/2 w-2 h-1" :
            size === "md" ? "bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-2" :
            "bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-3"
          )} />
        </div>
        
        {/* Robot Arms */}
        <div className={cn(
          "absolute top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-primary to-accent rounded-full",
          armSizes[size],
          size === "sm" ? "-left-3" : size === "md" ? "-left-4" : "-left-6"
        )} />
        <div className={cn(
          "absolute top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-primary to-accent rounded-full",
          armSizes[size],
          size === "sm" ? "-right-3" : size === "md" ? "-right-4" : "-right-6"
        )} />
      </div>
    </div>
  );

  return animate ? (
    <motion.div
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {robotContainer}
    </motion.div>
  ) : robotContainer;
}
