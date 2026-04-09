import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cropTypes = [
    "Maize", "Soybean", "Tobacco", "Groundnut", "Rice",
    "Sorghum", "Millet", "Cassava", "Sweet Potato", "Irish Potato",
    "Beans", "Cowpea", "Pigeon Pea", "Sunflower", "Cotton",
    "Sugarcane", "Banana", "Tomato", "Onion", "Cabbage",
    "Paprika", "Chilli", "Wheat", "Barley", "Sesame",
];

async function main() {
    console.log("Seeding crop types...");
    for (const name of cropTypes) {
        await prisma.cropType.upsert({
            where: { name },
            update: {},
            create: { name, isCustom: false },
        });
    }
    console.log("Done.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());