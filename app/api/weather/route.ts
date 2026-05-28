import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check cache (max 3 hours old)
    const cached = await prisma.weatherCache.findUnique({ where: { farmId: farm.id } });
    if (cached) {
        const ageHours = (Date.now() - cached.cachedAt.getTime()) / 3600000;
        if (ageHours < 3) return NextResponse.json(cached.data);
    }

    // Default to Lilongwe if no location set
    const lat = -13.9626;
    const lon = 33.7741;

    const farmNameLower = farm.name?.toLowerCase() ?? "";
    const locationLat = farmNameLower.includes("blantyre") ? -15.7861 :
        farmNameLower.includes("mzuzu") ? -11.4658 :
            farmNameLower.includes("zomba") ? -15.3867 : lat;
    const locationLon = farmNameLower.includes("blantyre") ? 35.0058 :
        farmNameLower.includes("mzuzu") ? 34.0154 :
            farmNameLower.includes("zomba") ? 35.3175 : lon;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${locationLat}&longitude=${locationLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=Africa%2FBlantyre&forecast_days=7`;

    try {
        const res = await fetch(url);
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

        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: "Weather service unavailable" }, { status: 503 });
    }
}