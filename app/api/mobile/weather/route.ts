import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";

export const dynamic = "force-dynamic";

function farmCoordinates(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("blantyre")) return { lat: -15.7861, lon: 35.0058 };
  if (lower.includes("mzuzu")) return { lat: -11.4658, lon: 34.0154 };
  if (lower.includes("zomba")) return { lat: -15.3867, lon: 35.3175 };
  return { lat: -13.9626, lon: 33.7741 };
}

function planningGuidance() {
  return [
    "Check rainfall before spraying or applying fertiliser.",
    "Prioritise irrigation checks during hot, dry weeks.",
    "Avoid harvesting during heavy rain windows where possible.",
    "Use field notes and recent weather together for planting decisions.",
  ];
}

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const farm = await prisma.farm.findUnique({ where: { id: session.farmId } });
  if (!farm) return NextResponse.json({ error: "Farm not found" }, { status: 404 });

  const cached = await prisma.weatherCache.findUnique({ where: { farmId: farm.id } });
  if (cached) {
    const ageHours = (Date.now() - cached.cachedAt.getTime()) / 3600000;
    if (ageHours < 3) {
      return NextResponse.json({ ...(cached.data as any), source: "cache", guidance: planningGuidance() });
    }
  }

  const { lat, lon } = farmCoordinates(farm.name);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=Africa%2FBlantyre&forecast_days=7`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather provider failed");
    const weatherData = await res.json();
    const data = {
      farmName: farm.name,
      current: {
        temp: Math.round(weatherData.current.temperature_2m),
        feelsLike: Math.round(weatherData.current.apparent_temperature),
        humidity: weatherData.current.relative_humidity_2m,
        precipitation: weatherData.current.precipitation,
        windSpeed: Math.round(weatherData.current.wind_speed_10m),
        windDirection: weatherData.current.wind_direction_10m,
        code: weatherData.current.weather_code,
      },
      daily: weatherData.daily.time.map((date: string, i: number) => ({
        date,
        code: weatherData.daily.weather_code[i],
        tempMax: Math.round(weatherData.daily.temperature_2m_max[i]),
        tempMin: Math.round(weatherData.daily.temperature_2m_min[i]),
        precipitation: weatherData.daily.precipitation_sum[i],
        precipProbability: weatherData.daily.precipitation_probability_max[i],
        windMax: Math.round(weatherData.daily.wind_speed_10m_max[i]),
      })),
      fetchedAt: new Date().toISOString(),
    };

    await prisma.weatherCache.upsert({
      where: { farmId: farm.id },
      update: { data, cachedAt: new Date() },
      create: { farmId: farm.id, data, cachedAt: new Date() },
    });

    return NextResponse.json({ ...data, source: "provider", guidance: planningGuidance() });
  } catch {
    return NextResponse.json({
      farmName: farm.name,
      current: null,
      daily: [],
      source: cached ? "stale-cache" : "fallback",
      cachedAt: cached?.cachedAt ?? null,
      cached: cached?.data ?? null,
      guidance: planningGuidance(),
      providerAvailable: false,
    });
  }
}
