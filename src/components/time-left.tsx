import { useEffect, useMemo, useState } from "react";
import { intervalToDuration, isAfter, parseISO } from "date-fns";

type Props = {
  startDate: string;
};

export function TimeLeft({ startDate }: Props) {
  const [duration, setDuration] = useState<ReturnType<
    typeof intervalToDuration
  > | null>(null);
  const [isPast, setIsPast] = useState(false);

  const targetDate = useMemo(() => parseISO(startDate), [startDate]);

  useEffect(() => {
    const update = () => {
      const now = new Date();

      if (isAfter(now, targetDate)) {
        setIsPast(true);
        setDuration(null);
        return;
      }

      setIsPast(false);
      setDuration(intervalToDuration({ start: now, end: targetDate }));
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const formatMessage = () => {
    if (!duration) return "...";

    const totalHours = (duration.days ?? 0) * 24 + (duration.hours ?? 0);
    const totalMinutes = totalHours * 60 + (duration.minutes ?? 0);

    if (totalHours >= 24) {
      const days = duration.days ?? 0;
      const hours = duration.hours ?? 0;
      if (hours === 0) {
        return `empieza en ${days} ${days === 1 ? "día" : "días"}`;
      }
      return `empieza en ${days} ${days === 1 ? "día" : "días"} y ${hours} ${
        hours === 1 ? "hora" : "horas"
      }`;
    }

    if (totalMinutes >= 60) {
      const hours = duration.hours ?? 0;
      const minutes = duration.minutes ?? 0;
      return `empieza en ${hours} ${
        hours === 1 ? "hora" : "horas"
      }, ${minutes} ${minutes === 1 ? "minuto" : "minutos"}!`;
    }

    const minutes = duration.minutes ?? 0;
    const seconds = duration.seconds ?? 0;
    return `empieza en ${minutes} ${
      minutes === 1 ? "minuto" : "minutos"
    }, ${seconds} ${seconds === 1 ? "segundo" : "segundos"}!`;
  };

  return <p>{isPast ? "ya pasó. te lo perdiste" : formatMessage()}</p>;
}
