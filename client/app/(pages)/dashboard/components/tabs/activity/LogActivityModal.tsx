'use client';

import { useState } from 'react';
import {
  Loader2, Dumbbell, Utensils, Moon, Brain, Heart, Droplets,
  Footprints, Zap, Activity, Clock, Timer, AlignLeft, Tag,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface LogActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ACTIVITY_TYPES = [
  { value: 'workout', label: 'Workout', icon: Dumbbell, color: 'from-orange-500 to-red-500', pillar: 'fitness' },
  { value: 'meal', label: 'Meal', icon: Utensils, color: 'from-green-500 to-emerald-500', pillar: 'nutrition' },
  { value: 'sleep', label: 'Sleep', icon: Moon, color: 'from-indigo-500 to-purple-500', pillar: 'wellbeing' },
  { value: 'mindfulness', label: 'Mindfulness', icon: Brain, color: 'from-cyan-500 to-blue-500', pillar: 'wellbeing' },
  { value: 'recovery', label: 'Recovery', icon: Heart, color: 'from-emerald-500 to-teal-500', pillar: 'wellbeing' },
  { value: 'water', label: 'Hydration', icon: Droplets, color: 'from-blue-400 to-cyan-500', pillar: 'nutrition' },
  { value: 'steps', label: 'Steps', icon: Footprints, color: 'from-teal-500 to-green-500', pillar: 'fitness' },
  { value: 'habit', label: 'Habit', icon: Zap, color: 'from-yellow-500 to-amber-500', pillar: 'wellbeing' },
];

const PILLARS = [
  { value: 'fitness', label: 'Fitness', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
  { value: 'nutrition', label: 'Nutrition', color: 'text-green-400 bg-green-500/20 border-green-500/30' },
  { value: 'wellbeing', label: 'Wellbeing', color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
];

function nowLocalISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function LogActivityModal({ open, onOpenChange, onSuccess }: LogActivityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    duration: '',
    pillar: '',
    completedAt: nowLocalISO(),
  });

  const resetForm = () => {
    setFormData({
      type: '',
      title: '',
      description: '',
      duration: '',
      pillar: '',
      completedAt: nowLocalISO(),
    });
  };

  const handleTypeSelect = (type: string) => {
    const actType = ACTIVITY_TYPES.find((t) => t.value === type);
    setFormData((prev) => ({
      ...prev,
      type,
      pillar: actType?.pillar || prev.pillar,
      title: prev.title || actType?.label || '',
    }));
  };

  const canSubmit =
    formData.type && formData.title.trim() && formData.pillar && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      await api.post('/activity/logs', {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        duration: formData.duration ? parseInt(formData.duration, 10) : undefined,
        pillar: formData.pillar,
        completedAt: formData.completedAt
          ? new Date(formData.completedAt).toISOString()
          : undefined,
      });

      toast.success('Activity logged successfully');
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to log activity';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg bg-slate-900 border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            Log Activity
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Activity Type Grid */}
          <div className="space-y-2">
            <Label className="text-sm text-slate-400">Activity Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {ACTIVITY_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeSelect(type.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? `bg-gradient-to-br ${type.color} text-white shadow-lg`
                        : 'bg-white/5 text-slate-400 border border-white/[0.06] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Title
            </Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Morning run, Lunch, Meditation"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-sky-500/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm text-slate-400 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5" />
              Description (optional)
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Add details about this activity..."
              rows={2}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-sky-500/50 resize-none"
            />
          </div>

          {/* Duration + DateTime row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm text-slate-400 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                Duration (min)
              </Label>
              <Input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                placeholder="30"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-sky-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Completed At
              </Label>
              <Input
                type="datetime-local"
                value={formData.completedAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, completedAt: e.target.value }))}
                className="bg-white/5 border-white/10 text-white [color-scheme:dark] focus:border-sky-500/50"
              />
            </div>
          </div>

          {/* Pillar */}
          <div className="space-y-2">
            <Label className="text-sm text-slate-400">Pillar</Label>
            <div className="flex gap-2">
              {PILLARS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, pillar: p.value }))}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    formData.pillar === p.value
                      ? p.color
                      : 'text-slate-400 bg-white/5 border-white/[0.06] hover:bg-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              className="flex-1 h-12 text-slate-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 rounded-xl font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging...
                </>
              ) : (
                'Log Activity'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
