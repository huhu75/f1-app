"use client";

import { useState, useEffect } from "react";
import { fetchCalendar, Race } from "@/lib/f1-data";

export function useCalendar() {
  const [calendar, setCalendar] = useState<Race[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = () => {
    setIsLoading(true);
    fetchCalendar().then((races) => {
      setCalendar(races);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  return { calendar, isLoading, refresh };
}
