'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Clock, Timer, AlignLeft, Tag } from 'lucide-react';
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
import {
  scheduleService,
  type UpdateScheduleItemRequest,
} from '@/src/shared/services/schedule.service';
import toast from 'react-hot-toast';

interface ScheduleActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  preferredTime: string;
  duration?: number;
  status: string;
}

interface PlanData {
  id: string;
  activities: ScheduleActivity[];
}

interface EditScheduleItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ScheduleActivity | null;
  plan?: PlanData | null;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'Work', label: 'Work' },
  { value: 'Exercise', label: 'Exercise' },
  { value: 'Meal', label: 'Meal' },
  { value: 'Break', label: 'Break' },
  { value: 'Personal', label: 'Personal' },
  { value: 'Study', label: 'Study' },
  { value: 'Social', label: 'Social' },
  { value: 'Health', label: 'Health' },
  { value: 'Other', label: 'Other' },
];

function calcDuration(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : null;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export function EditScheduleItemModal({
  open,
  onOpenChange,
  activity,
  plan,
  onSuccess,
}: EditScheduleItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    category: '',
  });

  useEffect(() => {
    if (activity && open) {
      const startTime = activity.preferredTime || '';
      const endTime = activity.duration
        ? addMinutes(startTime, activity.duration)
        : '';
      setFormData({
        title: activity.title,
        description: activity.description || '',
        start_time: startTime,
        end_time: endTime,
        category: activity.type
          ? activity.type.charAt(0).toUpperCase() + activity.type.slice(1)
          : '',
      });
    }
  }, [activity, open]);

  const duration = useMemo(
    () => calcDuration(formData.start_time, formData.end_time),
    [formData.start_time, formData.end_time],
  );

  const timeError = useMemo(() => {
    if (!formData.start_time || !formData.end_time) return null;
    const [sh, sm] = formData.start_time.split(':').map(Number);
    const [eh, em] = formData.end_time.split(':').map(Number);
    if (eh * 60 + em <= sh * 60 + sm) return 'End time must be after start time';
    return null;
  }, [formData.start_time, formData.end_time]);

  const canSubmit =
    formData.title.trim() && formData.start_time && !timeError && !isSubmitting;

  const handleSubmit = async () => {
    if (!activity || !canSubmit) return;
    setIsSubmitting(true);

    try {
      if (plan) {
        // Plan-based activity: update via plan API
        const updatedActivities = (plan.activities || []).map((a) => {
          if (a.id !== activity.id) return a;
          return {
            ...a,
            title: formData.title.trim(),
            description: formData.description.trim(),
            preferredTime: formData.start_time,
            duration: duration ?? a.duration,
            type: formData.category.toLowerCase() || a.type,
          };
        });

        await api.patch(`/plans/${plan.id}`, {
          activities: updatedActivities,
        });
      } else {
        // Schedule-based item: update via schedule service
        const payload: UpdateScheduleItemRequest = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          start_time: formData.start_time,
          end_time: formData.end_time || undefined,
          duration_minutes: duration ?? undefined,
          category: formData.category || undefined,
        };
        await scheduleService.updateScheduleItem(activity.id, payload);
      }

      toast.success('Schedule item updated');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update schedule item';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">
            Edit Schedule Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Title
            </Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Activity name"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-sky-500/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm text-slate-400 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5" />
              Description
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Optional description"
              rows={2}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-sky-500/50 resize-none"
            />
          </div>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Start Time
              </Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
                className="bg-white/5 border-white/10 text-white [color-scheme:dark] focus:border-sky-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                End Time
              </Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    end_time: e.target.value,
                  }))
                }
                className="bg-white/5 border-white/10 text-white [color-scheme:dark] focus:border-sky-500/50"
              />
            </div>
          </div>

          {/* Time error / duration display */}
          {timeError ? (
            <p className="text-xs text-red-400">{timeError}</p>
          ) : duration ? (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Timer className="w-3 h-3" />
              Duration: {duration}m
            </p>
          ) : null}

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm text-slate-400">Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      category:
                        prev.category === cat.value ? '' : cat.value,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    formData.category === cat.value
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
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
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
