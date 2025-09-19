import { motion } from "framer-motion";
import { StickyNote, Music, Gamepad2, Settings } from "lucide-react";
import RobotCharacter from "./RobotCharacter";

export default function OrbitalInterface() {
  const orbitalElements = [
    { icon: StickyNote, position: "top-4 left-1/2 transform -translate-x-1/2", color: "text-primary" },
    { icon: Music, position: "top-1/2 right-4 transform -translate-y-1/2", color: "text-secondary" },
    { icon: Gamepad2, position: "bottom-4 left-1/2 transform -translate-x-1/2", color: "text-accent" },
    { icon: Settings, position: "top-1/2 left-4 transform -translate-y-1/2", color: "text-muted-foreground" },
  ];

  return (
    <div className="glass-card rounded-3xl h-[28rem] md:h-[34rem] lg:h-[38rem] relative overflow-hidden flex items-center justify-center w-full" data-testid="orbital-interface">
      {/* Orbital Rings */}
      <motion.div 
        className="orbital-ring w-96 h-96 md:w-[28rem] md:h-[28rem] lg:w-[32rem] lg:h-[32rem]"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        data-testid="orbital-ring"
      >
        {/* Orbital Elements */}
        {orbitalElements.map((element, index) => {
          const Icon = element.icon;
          return (
            <motion.div
              key={index}
              className={`orbital-element ${element.position}`}
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              data-testid={`orbital-element-${index}`}
            >
              <div className="glass-card p-3 rounded-xl">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <Icon className={`${element.color} text-lg`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Central Robot Character */}
      <div className="absolute inset-0 flex items-center justify-center" data-testid="central-robot">
        <RobotCharacter size="lg" />
      </div>
    </div>
  );
}
