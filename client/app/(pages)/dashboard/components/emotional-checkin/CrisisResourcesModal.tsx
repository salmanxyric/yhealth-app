"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Phone, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

interface CrisisResourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CrisisResourcesModal({ open, onOpenChange }: CrisisResourcesModalProps) {
  // Default US resources - in production, this would be region-specific
  const resources = [
    {
      name: "National Suicide Prevention Lifeline",
      number: "988",
      type: "phone",
      description: "24/7 free and confidential support for people in distress",
    },
    {
      name: "Crisis Text Line",
      number: "Text HOME to 741741",
      type: "text",
      description: "Free 24/7 crisis support via text message",
    },
    {
      name: "Emergency Services",
      number: "911",
      type: "emergency",
      description: "For life-threatening emergencies",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            <span>Support Resources</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-slate-300 leading-relaxed">
            I want to make sure you have the support you need right now. Here are some resources
            that can help:
          </p>

          <div className="space-y-3">
            {resources.map((resource, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    {resource.type === "text" ? (
                      <MessageSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Phone className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{resource.name}</h3>
                    <p className="text-emerald-400 font-mono text-lg mb-2">{resource.number}</p>
                    <p className="text-slate-400 text-sm">{resource.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-amber-900/20 border border-amber-500/30">
            <p className="text-amber-200 text-sm leading-relaxed">
              <strong>Remember:</strong> You&apos;re not alone. Reaching out for help is a sign of
              strength. If you&apos;re in immediate danger, please call 911 or go to your nearest
              emergency room.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

