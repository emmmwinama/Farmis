export type CropTimelineStep = {
  id: string;
  title: string;
  startDay: number;
  endDay: number;
  category: "preparation" | "planting" | "crop-care" | "harvest" | "post-harvest";
  activityTypes: string[];
  recommendation: string;
};

export type CropTimeline = {
  crop: string;
  aliases: string[];
  sourceNote: string;
  steps: CropTimelineStep[];
};

const BASE_CEREAL: CropTimelineStep[] = [
  step("land-preparation", "Land preparation", -30, -1, "preparation", ["land preparation", "clearing", "ploughing", "ridging"], "Prepare seedbed, conserve moisture, and record labour and machinery work."),
  step("planting", "Planting", 0, 3, "planting", ["planting", "sowing", "seeding"], "Plant at the recommended spacing when soil moisture is adequate."),
  step("gap-fill-thin", "Gap filling and thinning", 10, 21, "crop-care", ["gap filling", "thinning", "replanting"], "Check emergence, fill gaps, and thin to the target plant population."),
  step("basal-fertilizer", "Basal fertilizer application", 10, 21, "crop-care", ["basal fertilizer", "basal fertiliser", "compound fertilizer", "compound fertiliser"], "Apply basal fertilizer early and record the source, quantity, and cost before first weeding."),
  step("first-weeding", "First weeding", 14, 28, "crop-care", ["weeding", "herbicide", "first weeding"], "Control early weeds before they compete strongly with the crop."),
  step("scouting", "Pest and disease scouting", 21, 70, "crop-care", ["scouting", "spraying", "pest control", "disease control"], "Scout for pests, diseases, and nutrient stress; record observations and treatments."),
  step("top-dressing", "Top dressing", 28, 49, "crop-care", ["top dressing", "fertilizing", "fertilising", "urea", "can"], "Apply nitrogen or other top dressing when the crop is established and moisture is present."),
  step("second-weeding", "Second weeding", 35, 56, "crop-care", ["second weeding", "weeding", "earthing", "hilling"], "Remove later weeds and earth up where the crop needs support."),
  step("harvest", "Harvesting", 110, 150, "harvest", ["harvesting", "harvest"], "Harvest once mature and dry enough to reduce field losses."),
  step("drying-storage", "Drying and storage", 115, 165, "post-harvest", ["drying", "shelling", "threshing", "storage", "grading"], "Dry, clean, grade, treat where appropriate, and store in a protected place."),
];

const LEGUME: CropTimelineStep[] = [
  step("land-preparation", "Land preparation", -30, -1, "preparation", ["land preparation", "clearing", "ploughing", "ridging"], "Prepare a fine seedbed and record field condition before planting."),
  step("seed-prep", "Seed selection and treatment", -7, 0, "preparation", ["seed selection", "seed treatment", "inoculation"], "Select clean seed; inoculate legumes where needed and record seed lot details."),
  step("planting", "Planting", 0, 3, "planting", ["planting", "sowing", "seeding"], "Plant with adequate moisture and capture variety, spacing, and seed source."),
  step("first-weeding", "First weeding", 14, 28, "crop-care", ["weeding", "herbicide", "first weeding"], "Weed early to protect establishment."),
  step("scouting", "Pest and disease scouting", 21, 70, "crop-care", ["scouting", "spraying", "pest control", "disease control"], "Scout every 1-2 weeks during vegetative and flowering stages."),
  step("second-weeding", "Second weeding", 35, 49, "crop-care", ["second weeding", "weeding"], "Keep the canopy clean before flowering and pod set."),
  step("harvest", "Harvesting", 90, 135, "harvest", ["harvesting", "lifting", "harvest"], "Harvest promptly at maturity to reduce shattering, sprouting, or quality loss."),
  step("drying-grading-storage", "Drying, grading, and storage", 95, 145, "post-harvest", ["drying", "grading", "shelling", "threshing", "storage"], "Dry on clean surfaces, grade, bag, and store away from moisture."),
];

const VEGETABLE: CropTimelineStep[] = [
  step("nursery-land-prep", "Nursery and land preparation", -35, -1, "preparation", ["nursery", "land preparation", "bed preparation", "compost"], "Raise or source healthy seedlings and prepare beds with manure or basal fertilizer."),
  step("transplanting", "Transplanting or planting", 0, 3, "planting", ["transplanting", "planting", "sowing"], "Transplant or plant when seedlings and soil moisture are ready."),
  step("irrigation-establishment", "Establishment watering", 0, 14, "crop-care", ["irrigation", "watering"], "Water consistently during establishment and record irrigation events."),
  step("first-weeding", "First weeding", 14, 28, "crop-care", ["weeding", "mulching"], "Weed and mulch early to reduce competition and moisture stress."),
  step("feeding", "Top dressing", 21, 45, "crop-care", ["top dressing", "fertilizing", "fertilising"], "Apply top dressing in split doses according to crop condition."),
  step("crop-protection", "Pest and disease control", 14, 90, "crop-care", ["scouting", "spraying", "pest control", "disease control"], "Scout frequently and record chemical spray details when treatment is needed."),
  step("harvest", "Harvesting", 70, 130, "harvest", ["harvesting", "harvest", "picking"], "Harvest at marketable stage and capture grade, quantity, and buyer evidence."),
  step("post-harvest", "Sorting and storage", 70, 140, "post-harvest", ["sorting", "grading", "storage", "packing"], "Sort, grade, pack, and store in cool shaded conditions where possible."),
];

const ROOT_TUBER: CropTimelineStep[] = [
  step("land-preparation", "Land preparation and ridging", -30, -1, "preparation", ["land preparation", "ridging", "mounding"], "Prepare ridges or mounds and record labour or machinery costs."),
  step("planting", "Planting cuttings or seed tubers", 0, 7, "planting", ["planting", "cuttings", "vine planting", "seed tuber"], "Plant clean material at the start of reliable moisture."),
  step("gap-fill", "Gap filling", 14, 28, "crop-care", ["gap filling", "replanting"], "Replace failed plants while the crop is still young."),
  step("weeding-earthing", "Weeding and earthing up", 21, 60, "crop-care", ["weeding", "earthing", "hilling"], "Weed and earth up ridges to support tuber development."),
  step("scouting", "Pest and disease scouting", 30, 120, "crop-care", ["scouting", "spraying", "pest control", "disease control"], "Scout for foliar disease, pests, and poor stands."),
  step("harvest", "Harvesting", 100, 300, "harvest", ["harvesting", "lifting", "harvest"], "Harvest according to maturity, market demand, and storage capacity."),
  step("curing-storage", "Curing and storage", 100, 315, "post-harvest", ["curing", "sorting", "grading", "storage"], "Cure, sort damaged roots or tubers, and store in ventilated conditions."),
];

export const CROP_TIMELINES: CropTimeline[] = [
  timeline("Maize", ["corn"], BASE_CEREAL),
  timeline("Soybean", ["soya", "soya beans", "soy beans"], LEGUME.map((s) => s.id === "seed-prep" ? { ...s, title: "Seed inoculation and treatment", activityTypes: [...s.activityTypes, "seed inoculation"] } : s)),
  timeline("Tobacco", ["burley tobacco"], [
    step("nursery", "Nursery establishment", -60, -30, "preparation", ["nursery", "seedbed"], "Prepare seedbed, sow nursery, and record seed and chemical evidence."),
    step("land-preparation", "Land preparation and ridging", -30, -1, "preparation", ["land preparation", "ridging", "basal fertilizer"], "Prepare ridges and basal nutrients before transplanting."),
    step("transplanting", "Transplanting", 0, 7, "planting", ["transplanting", "planting"], "Transplant healthy seedlings after reliable rains or irrigation."),
    step("gap-fill", "Gap filling", 7, 21, "crop-care", ["gap filling", "replanting"], "Replace dead seedlings quickly to keep a uniform stand."),
    step("weeding", "Weeding and banking", 14, 45, "crop-care", ["weeding", "banking", "earthing"], "Control weeds and bank soil around plants."),
    step("topping-suckering", "Topping and suckering", 55, 85, "crop-care", ["topping", "suckering"], "Top and remove suckers at the correct stage for leaf quality."),
    step("harvest-curing", "Harvesting and curing", 80, 130, "harvest", ["harvesting", "curing"], "Harvest ripe leaves in passes and record curing barn costs."),
    step("grading-storage", "Grading and storage", 100, 150, "post-harvest", ["grading", "baling", "storage"], "Grade, bale, and store leaf with buyer-ready traceability."),
  ]),
  timeline("Groundnut", ["groundnuts", "peanut", "peanuts"], LEGUME.map((s) => s.id === "harvest" ? { ...s, startDay: 115, endDay: 140, activityTypes: [...s.activityTypes, "lifting"] } : s)),
  timeline("Rice", ["paddy"], [
    step("nursery-land-prep", "Nursery and paddy preparation", -30, -1, "preparation", ["nursery", "land preparation", "puddling", "bund repair"], "Prepare nursery, paddies, bunds, and irrigation channels."),
    step("planting", "Transplanting or direct seeding", 0, 7, "planting", ["transplanting", "planting", "sowing"], "Transplant seedlings or direct seed with reliable water control."),
    step("water-management", "Water management", 0, 100, "crop-care", ["irrigation", "water management", "drainage"], "Maintain water levels and record irrigation or drainage actions."),
    step("weeding", "Weeding", 14, 45, "crop-care", ["weeding", "herbicide"], "Control weeds early in the paddy."),
    step("fertilizer", "Top dressing", 21, 55, "crop-care", ["top dressing", "fertilizing", "fertilising"], "Apply split fertilizer according to crop stage and water availability."),
    step("scouting", "Pest and disease scouting", 21, 90, "crop-care", ["scouting", "spraying", "pest control", "disease control"], "Scout for pests and disease, especially around tillering and panicle initiation."),
    step("harvest", "Harvesting", 100, 150, "harvest", ["harvesting", "harvest"], "Harvest at grain maturity and drain fields before cutting where needed."),
    step("drying-storage", "Drying and storage", 105, 160, "post-harvest", ["drying", "threshing", "milling", "storage"], "Thresh, dry, clean, and store paddy safely."),
  ]),
  timeline("Sorghum", [], BASE_CEREAL.map((s) => s.id === "harvest" ? { ...s, startDay: 100, endDay: 130 } : s)),
  timeline("Millet", [], BASE_CEREAL.map((s) => s.id === "harvest" ? { ...s, startDay: 85, endDay: 120 } : s)),
  timeline("Cassava", ["manioc"], ROOT_TUBER.map((s) => s.id === "harvest" ? { ...s, startDay: 240, endDay: 365 } : s)),
  timeline("Sweet Potato", ["sweet potatoes"], ROOT_TUBER.map((s) => s.id === "harvest" ? { ...s, startDay: 90, endDay: 150 } : s)),
  timeline("Irish Potato", ["potato", "white potato"], ROOT_TUBER.map((s) => s.id === "harvest" ? { ...s, startDay: 90, endDay: 130 } : s)),
  timeline("Beans", ["bean"], LEGUME.map((s) => s.id === "harvest" ? { ...s, startDay: 75, endDay: 110 } : s)),
  timeline("Cowpea", ["cowpeas"], LEGUME.map((s) => s.id === "harvest" ? { ...s, startDay: 75, endDay: 100 } : s)),
  timeline("Pigeon Pea", ["pigeonpea", "pigeon peas"], LEGUME.map((s) => s.id === "harvest" ? { ...s, startDay: 130, endDay: 180 } : s)),
  timeline("Sunflower", [], BASE_CEREAL.map((s) => s.id === "harvest" ? { ...s, startDay: 105, endDay: 130 } : s)),
  timeline("Cotton", [], [
    step("land-preparation", "Land preparation", -30, -1, "preparation", ["land preparation", "ripping", "ploughing"], "Prepare rows and conserve moisture before planting."),
    step("planting", "Planting", 0, 5, "planting", ["planting", "sowing"], "Plant when soil moisture is sufficient."),
    step("thinning", "Thinning and gap filling", 10, 21, "crop-care", ["thinning", "gap filling"], "Thin and gap fill for a uniform stand."),
    step("weeding", "Weeding", 14, 50, "crop-care", ["weeding", "herbicide"], "Keep the field weed-free during establishment."),
    step("scouting-spraying", "Pest scouting and spraying", 21, 120, "crop-care", ["scouting", "spraying", "pest control"], "Scout regularly for bollworms and sucking pests; record chemical use."),
    step("picking", "Picking", 140, 190, "harvest", ["picking", "harvesting", "harvest"], "Pick open bolls in passes and keep grades separate."),
    step("grading-storage", "Grading and storage", 145, 200, "post-harvest", ["grading", "storage", "baling"], "Dry, sort, grade, and store cotton away from contamination."),
  ]),
  timeline("Sugarcane", ["sugar cane"], [
    step("land-preparation", "Land preparation and furrowing", -45, -1, "preparation", ["land preparation", "furrowing", "ripping"], "Prepare furrows and irrigation access before planting setts."),
    step("planting", "Planting setts", 0, 7, "planting", ["planting", "setts"], "Plant healthy setts and record source and labour."),
    step("gap-fill", "Gap filling", 21, 45, "crop-care", ["gap filling", "replanting"], "Fill gaps early to protect cane stand."),
    step("weeding", "Weeding", 21, 90, "crop-care", ["weeding", "herbicide"], "Keep rows weed-free while canopy closes."),
    step("fertilizer-irrigation", "Fertilizer and irrigation", 30, 240, "crop-care", ["fertilizing", "fertilising", "irrigation"], "Record split fertilizer and irrigation work."),
    step("harvest", "Cutting and loading", 270, 365, "harvest", ["cutting", "harvesting", "loading"], "Cut mature cane and link harvested tonnage to buyer records."),
    step("ratoon-management", "Ratoon and residue management", 275, 380, "post-harvest", ["ratoon", "trash management", "storage"], "Record ratoon decisions, residue handling, and field clean-up."),
  ]),
  timeline("Banana", ["bananas"], [
    step("land-preparation", "Land preparation and pits", -30, -1, "preparation", ["land preparation", "pit preparation", "manure"], "Prepare pits, manure, and drainage before planting."),
    step("planting", "Planting suckers or tissue culture plants", 0, 7, "planting", ["planting", "suckers"], "Plant clean material and record source."),
    step("mulching-irrigation", "Mulching and irrigation", 7, 180, "crop-care", ["mulching", "irrigation", "watering"], "Maintain moisture and mulch around plants."),
    step("desuckering", "Desuckering and sanitation", 30, 240, "crop-care", ["desuckering", "pruning", "sanitation"], "Remove excess suckers and diseased leaves."),
    step("feeding", "Fertilizer or manure application", 30, 240, "crop-care", ["fertilizing", "fertilising", "manure"], "Feed periodically and record labour and input cost."),
    step("propping-bagging", "Propping and bunch care", 180, 300, "crop-care", ["propping", "bagging", "scouting"], "Support bunches and scout for pests or disease."),
    step("harvest", "Harvesting bunches", 300, 365, "harvest", ["harvesting", "harvest"], "Harvest mature bunches and capture grade, buyer, and transport details."),
    step("post-harvest", "Cleaning and storage", 300, 370, "post-harvest", ["cleaning", "grading", "storage", "packing"], "Clean, grade, and move fruit quickly to market or cool storage."),
  ]),
  timeline("Tomato", ["tomatoes"], VEGETABLE.map((s) => s.id === "harvest" ? { ...s, startDay: 70, endDay: 110, activityTypes: [...s.activityTypes, "picking"] } : s)),
  timeline("Onion", ["onions"], VEGETABLE.map((s) => s.id === "harvest" ? { ...s, startDay: 90, endDay: 150 } : s).map((s) => s.id === "post-harvest" ? { ...s, title: "Curing, grading, and storage", activityTypes: [...s.activityTypes, "curing"] } : s)),
  timeline("Cabbage", ["cabbages"], VEGETABLE.map((s) => s.id === "harvest" ? { ...s, startDay: 75, endDay: 120 } : s)),
];

export function getCropTimeline(cropName: string | null | undefined) {
  const normalized = normalize(cropName ?? "");
  return CROP_TIMELINES.find((timeline) =>
    normalize(timeline.crop) === normalized || timeline.aliases.some((alias) => normalize(alias) === normalized),
  ) ?? null;
}

export function buildCropTimelineStatus(crop: {
  id: string;
  cropTypeName?: string;
  cropType?: { name: string };
  variety?: string;
  fieldName?: string;
  field?: { name: string };
  plantingDate: Date | string;
  expectedHarvestDate?: Date | string;
  activities?: Array<{ activityType: string; date: Date | string }>;
}) {
  const cropName = crop.cropTypeName ?? crop.cropType?.name ?? "";
  const timeline = getCropTimeline(cropName);
  const plantingDate = new Date(crop.plantingDate);
  const today = startOfDay(new Date());
  const daysAfterPlanting = Math.floor((today.getTime() - startOfDay(plantingDate).getTime()) / 86400000);
  const activities = crop.activities ?? [];

  if (!timeline) {
    return { timeline: null, daysAfterPlanting, steps: [], dueSteps: [], nextStep: null, completedCount: 0 };
  }

  const steps = timeline.steps.map((stepItem) => {
    const dueStart = addDays(plantingDate, stepItem.startDay);
    const dueEnd = addDays(plantingDate, stepItem.endDay);
    const matchingActivities = activities.filter((activity) => matchesStep(activity.activityType, stepItem));
    const completed = matchingActivities.length > 0;
    const state = completed
      ? "done"
      : today < startOfDay(dueStart)
        ? "upcoming"
        : today > startOfDay(dueEnd)
          ? "overdue"
          : "due";

    return {
      ...stepItem,
      dueStart,
      dueEnd,
      completed,
      matchingActivities,
      state,
    };
  });

  const dueSteps = steps.filter((stepItem) => stepItem.state === "due" || stepItem.state === "overdue");
  const nextStep = dueSteps[0] ?? steps.find((stepItem) => stepItem.state === "upcoming") ?? null;

  return {
    timeline,
    daysAfterPlanting,
    steps,
    dueSteps,
    nextStep,
    completedCount: steps.filter((stepItem) => stepItem.completed).length,
  };
}

function step(
  id: string,
  title: string,
  startDay: number,
  endDay: number,
  category: CropTimelineStep["category"],
  activityTypes: string[],
  recommendation: string,
): CropTimelineStep {
  return { id, title, startDay, endDay, category, activityTypes, recommendation };
}

function timeline(crop: string, aliases: string[], steps: CropTimelineStep[]): CropTimeline {
  return {
    crop,
    aliases,
    sourceNote: "General guidance from FAO crop calendars, FAO crop growth-period tables, FAO mechanization guidance, Malawi Ministry crop commodity scope, and post-harvest handling references.",
    steps,
  };
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchesStep(activityType: string, stepItem: CropTimelineStep) {
  const activity = activityType.toLowerCase();
  return stepItem.activityTypes.some((type) => activity.includes(type.toLowerCase()) || type.toLowerCase().includes(activity));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
