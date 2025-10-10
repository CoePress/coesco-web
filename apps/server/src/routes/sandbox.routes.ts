import { Router } from "express";

const router = Router()

router.get("/hours", async (req, res) => {
  const { date, timezone, timezoneOffset } = req.query;
  
  const [year, month, day] = (date as string).split("-").map(Number);
  const hours = [];

  for (let i = 0; i < 24; i++) {
    const offsetMs = Number(timezoneOffset) * 60 * 1000;
    const hourDate = new Date(Date.UTC(year, month - 1, day, i, 0, 0, 0) + offsetMs);

    const clientHour = i % 12 || 12;
    const clientAmPm = i < 12 ? "AM" : "PM";
    const clientLabel = `${clientHour}:00 ${clientAmPm}`;

    const utcHour = hourDate.getUTCHours() % 12 || 12;
    const utcAmPm = hourDate.getUTCHours() < 12 ? "AM" : "PM";
    const utcLabel = `${utcHour}:00 ${utcAmPm}`;

    hours.push({
      hour: i,
      clientLabel,
      utcLabel,
      isoString: hourDate.toISOString(),
      localString: hourDate.toString(),
      utcHours: hourDate.getUTCHours(),
      localHours: hourDate.getHours(),
    });
  }

  res.json({
    success: true,
    data: {
      clientTimezone: timezone,
      clientOffset: timezoneOffset,
      date,
      hours,
    },
  });
});

router.get("/timezone", async (req, res) => {
  const { date, timezone } = req.query;

  const now = new Date();
  const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const dateFromString = new Date(`${date}T00:00:00`);
  const dateFromStringUTC = new Date(`${date}T00:00:00Z`);

  const [year, month, day] = (date as string).split("-").map(Number);
  const dateFromUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const dateFromLocal = new Date(year, month - 1, day, 0, 0, 0, 0);

  const divisions = [];
  for (let i = 0; i < 24; i++) {
    const divisionStart = new Date(dateFromUTC);
    divisionStart.setUTCHours(divisionStart.getUTCHours() + i);

    const hours = divisionStart.getUTCHours() % 12 || 12;
    const ampm = divisionStart.getUTCHours() < 12 ? "AM" : "PM";
    const label = `${hours}:00 ${ampm}`;

    divisions.push({
      hour: i,
      utcHours: divisionStart.getUTCHours(),
      localHours: divisionStart.getHours(),
      label,
      isoString: divisionStart.toISOString(),
      localString: divisionStart.toString(),
    });
  }

  res.json({
    success: true,
    data: {
      serverInfo: {
        now: now.toISOString(),
        nowLocal: now.toString(),
        timezone: serverTimezone,
        timezoneOffset: now.getTimezoneOffset(),
      },
      clientInfo: {
        dateParam: date,
        timezoneParam: timezone,
      },
      dateCreation: {
        fromString: {
          iso: dateFromString.toISOString(),
          local: dateFromString.toString(),
          utcHours: dateFromString.getUTCHours(),
          hours: dateFromString.getHours(),
        },
        fromStringUTC: {
          iso: dateFromStringUTC.toISOString(),
          local: dateFromStringUTC.toString(),
          utcHours: dateFromStringUTC.getUTCHours(),
          hours: dateFromStringUTC.getHours(),
        },
        fromUTC: {
          iso: dateFromUTC.toISOString(),
          local: dateFromUTC.toString(),
          utcHours: dateFromUTC.getUTCHours(),
          hours: dateFromUTC.getHours(),
        },
        fromLocal: {
          iso: dateFromLocal.toISOString(),
          local: dateFromLocal.toString(),
          utcHours: dateFromLocal.getUTCHours(),
          hours: dateFromLocal.getHours(),
        },
      },
      divisions: divisions.slice(0, 6),
    },
  });
});

export default router