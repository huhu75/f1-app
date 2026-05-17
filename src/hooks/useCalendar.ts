"use client";

import { useState, useEffect } from "react";
import { fetchCalendar, Race } from "@/lib/f1-data";

export function useCalendar() {
  const [calendar, setCalendar] = useState<Race[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCalendar().then((races) => {
      setCalendar(races);
      setIsLoading(false);
    });
  }, []);

  return { calendar, isLoading };
}
