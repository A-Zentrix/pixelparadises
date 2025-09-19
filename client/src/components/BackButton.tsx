import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

type BackButtonProps = {
  label?: string;
  className?: string;
  fallbackHref?: string;
};

export default function BackButton({ label = "Back", className = "", fallbackHref = "/" }: BackButtonProps) {
  const [, navigate] = useLocation();

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate(fallbackHref);
    }
  };

  return (
    <button
      onClick={goBack}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}


