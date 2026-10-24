import React, { forwardRef } from 'react';
import { cn } from '../lib/utils';
import { X } from 'lucide-react';

export const Card = ({ children, className, ...props }: any) => (
  <div className={cn("bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden", className)} {...props}>
    {children}
  </div>
);

export const Button = forwardRef<HTMLButtonElement, any>(({ children, variant = 'primary', size = 'md', className, ...props }, ref) => {
  const base = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 hover:shadow-lg focus:ring-primary",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary",
    outline: "border-2 border-border hover:bg-muted text-foreground focus:ring-slate-200",
    ghost: "hover:bg-muted text-foreground focus:ring-slate-200",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md focus:ring-destructive",
    accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-md shadow-accent/20 hover:shadow-lg focus:ring-accent"
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base"
  };
  return (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
});
Button.displayName = 'Button';

export const Input = forwardRef<HTMLInputElement, any>(({ className, error, ...props }, ref) => (
  <div className="w-full">
    <input 
      ref={ref}
      className={cn(
        "w-full px-4 py-3 rounded-xl bg-white border-2 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none",
        error ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10" : "border-border hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10",
        className
      )} 
      {...props} 
    />
    {error && <p className="mt-1.5 text-sm text-red-500 font-medium px-1">{error}</p>}
  </div>
));
Input.displayName = 'Input';

export const Label = ({ children, className, required }: any) => (
  <label className={cn("block text-sm font-bold text-slate-700 mb-1.5 ml-1", className)}>
    {children} {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

export const Badge = ({ children, className }: any) => (
  <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", className)}>
    {children}
  </span>
);

export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
