import React from "react";
import Image from "next/image";
import { Calendar, MapPin, Flag } from "lucide-react";
import { Button } from "./ui/Button";

interface RaceCardProps {
  id: string;
  name: string;
  location: string;
  date: string;
  circuitImage?: string;
  status: "upcoming" | "live" | "finished";
}

export const RaceCard = ({ name, location, date, status }: RaceCardProps) => {
  return (
    <div className="glass overflow-hidden hover:border-racing-red/50 transition-all group">
      <div className="relative h-48 bg-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
        <div className="absolute top-4 right-4 z-20">
          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm ${
            status === "upcoming" ? "bg-blue-600" : status === "live" ? "bg-racing-red animate-pulse" : "bg-zinc-700"
          }`}>
            {status === "upcoming" ? "À Venir" : status === "live" ? "En Direct" : "Terminé"}
          </span>
        </div>
        {/* Placeholder for circuit image */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <Flag className="w-24 h-24 rotate-12" />
        </div>
      </div>
      
      <div className="p-6 relative">
        <h3 className="text-xl font-black italic tracking-tight mb-4 group-hover:text-racing-red transition-colors uppercase">
          {name}
        </h3>
        
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <MapPin className="w-4 h-4 text-racing-red" />
            {location}
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Calendar className="w-4 h-4 text-racing-red" />
            {date}
          </div>
        </div>

        <Button variant={status === "upcoming" ? "primary" : "secondary"} size="sm" className="w-full">
          {status === "upcoming" ? "Pronostiquer" : "Voir Résultats"}
        </Button>
      </div>
    </div>
  );
};
