"use client";

import { motion } from "framer-motion";
import { ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SingleSelectProps } from "./types";

/**
 * SingleSelect - A single-choice selector with list or grid layout
 *
 * Features:
 * - List or grid layout options
 * - Animated selection indicator
 * - Optional descriptions and icons
 * - Accessible with keyboard navigation
 *
 * @example
 * <SingleSelect
 *   value={selected}
 *   onChange={setSelected}
 *   layout="list"
 *   options={[
 *     { value: "option1", label: "Option 1", description: "Description here" },
 *     { value: "option2", label: "Option 2" },
 *   ]}
 * />
 */
export function SingleSelect({
  id,
  label,
  value,
  onChange,
  options,
  layout = "list",
  columns = 2,
  disabled = false,
  error,
  className,
}: SingleSelectProps) {
  const isGrid = layout === "grid";

  const gridColsClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[columns];

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}

      <div
        role="radiogroup"
        aria-label={label || "Selection"}
        className={cn(
          isGrid ? `grid gap-3 ${gridColsClass}` : "space-y-3"
        )}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const optionId = id ? `${id}-${option.value}` : `select-${option.value}`;

          if (isGrid) {
            return (
              <GridOption
                key={option.value}
                id={optionId}
                option={option}
                isSelected={isSelected}
                disabled={disabled}
                onChange={onChange}
              />
            );
          }

          return (
            <ListOption
              key={option.value}
              id={optionId}
              option={option}
              isSelected={isSelected}
              disabled={disabled}
              onChange={onChange}
            />
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}

// List layout option
function ListOption({
  id,
  option,
  isSelected,
  disabled,
  onChange,
}: {
  id: string;
  option: SingleSelectProps["options"][number];
  isSelected: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <motion.button
      id={id}
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => !disabled && onChange(option.value)}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-xl",
        "transition-all duration-200 border text-left",
        isSelected
          ? "bg-blue-500/20 border-blue-500/50"
          : "bg-white/5 border-white/10 hover:bg-white/10",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      whileHover={!disabled ? { x: 4 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center gap-3">
        {option.icon && (
          <div className="text-slate-400">{option.icon}</div>
        )}
        <div>
          <span
            className={cn(
              "font-medium block",
              isSelected ? "text-white" : "text-slate-300"
            )}
          >
            {option.label}
          </span>
          {option.description && (
            <span className="text-sm text-slate-500 mt-0.5 block">
              {option.description}
            </span>
          )}
        </div>
      </div>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}

// Grid layout option
function GridOption({
  id,
  option,
  isSelected,
  disabled,
  onChange,
}: {
  id: string;
  option: SingleSelectProps["options"][number];
  isSelected: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <motion.button
      id={id}
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => !disabled && onChange(option.value)}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl",
        "transition-all duration-200 border text-center",
        isSelected
          ? "bg-blue-500/20 border-blue-500/50"
          : "bg-white/5 border-white/10 hover:bg-white/10",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {option.icon && (
        <div className={cn(
          "p-2 rounded-lg",
          isSelected ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-slate-400"
        )}>
          {option.icon}
        </div>
      )}
      <span
        className={cn(
          "font-medium text-sm",
          isSelected ? "text-white" : "text-slate-300"
        )}
      >
        {option.label}
      </span>
      {option.description && (
        <span className="text-xs text-slate-500">{option.description}</span>
      )}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}
