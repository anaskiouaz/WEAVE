import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative p-2.5 rounded-2xl transition-all duration-300 ease-out
        hover:-translate-y-0.5 active:scale-95
        ${isDark 
          ? 'bg-[var(--bg-elevated)] text-[var(--soft-coral)] hover:shadow-[var(--shadow-glow)]' 
          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--soft-coral)]'
        }
        shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]
        border border-[var(--border-light)]
        ${className}
      `}
      aria-label={isDark ? 'Activer le mode jour' : 'Activer le mode nuit'}
      title={isDark ? 'Mode jour' : 'Mode nuit'}
    >
      <div className="relative w-5 h-5">
        {/* Soleil */}
        <Sun 
          className={`
            w-5 h-5 absolute inset-0 transition-all duration-300
            ${isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}
          `}
        />
        {/* Lune */}
        <Moon 
          className={`
            w-5 h-5 absolute inset-0 transition-all duration-300
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}
          `}
        />
      </div>
    </button>
  );
}

// Version étendue avec label
export function ThemeToggleExtended({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ease-out
        hover:-translate-y-0.5 active:scale-[0.98]
        bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)]
        shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]
        border border-[var(--border-light)]
        ${className}
      `}
      aria-label={isDark ? 'Activer le mode jour' : 'Activer le mode nuit'}
    >
      <div 
        className={`
          p-2 rounded-xl transition-all duration-300
          ${isDark ? 'bg-[var(--soft-coral)]/15' : 'bg-[var(--sage-green)]/15'}
        `}
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-[var(--soft-coral)]" />
        ) : (
          <Sun className="w-5 h-5 text-[var(--sage-green)]" />
        )}
      </div>
      
      <div className="text-left">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {isDark ? 'Mode nuit' : 'Mode jour'}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {isDark ? 'Cocon nocturne' : 'Lumière douce'}
        </p>
      </div>

      {/* Toggle switch */}
      <div 
        className={`
          ml-auto w-11 h-6 rounded-full p-1 transition-all duration-300
          ${isDark ? 'bg-[var(--soft-coral)]' : 'bg-[var(--border-input)]'}
        `}
      >
        <div 
          className={`
            w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300
            ${isDark ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </div>
    </button>
  );
}
