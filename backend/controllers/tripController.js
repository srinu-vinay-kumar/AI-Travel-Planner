import asyncHandler from "express-async-handler";
import Trip from "../models/tripModel.js";

const VALID_TIMES = ["Morning", "Afternoon", "Evening"];

const sanitizeItinerary = (itinerary) => {
  if (!itinerary || !Array.isArray(itinerary)) return itinerary;

  return itinerary.map((day) => ({
    ...day,
    activities: (day.activities || []).map((activity) => {
      let time = activity.timeOfDay || "Afternoon";

      if (!VALID_TIMES.includes(time)) {
        const lowerTime = time.toLowerCase();
        if (lowerTime.includes("morning") || lowerTime.includes("early")) {
          time = "Morning";
        } else if (
          lowerTime.includes("night") ||
          lowerTime.includes("evening")
        ) {
          time = "Evening";
        } else {
          time = "Afternoon";
        }
      }

      return {
        ...activity,
        timeOfDay: time,
      };
    }),
  }));
};

// * generate new trip
const fetchWithRetry = async (url, options, retries = 5, delay = 1000) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw new Error(`External API Error: status code ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const generateNewTrip = asyncHandler(async (req, res) => {
  const { destination, durationDays, budgetTier, interests } = req.body;
  const userId = req.user.id;

  const prompt = `
    Create a detailed travel plan for a ${durationDays}-day trip to ${destination}.
    Budget preference is ${budgetTier}. Interests are: ${interests.join(", ")}.

    You must output ONLY a valid JSON object matching this structure:
    {
      "itinerary": [
        {
          "dayNumber": 1,
          "activities": [
            { "title": "Activity name", "description": "Brief text details", "estimatedCostUSD": 20, "timeOfDay": "Morning" }
          ]
        }
      ],
      "hotels": [
        { "name": "Recommended Hotel", "tier": "Budget", "estimatedCostNightUSD": 85, "rating": "4.5/5" }
      ],
      "estimatedBudget": {
        "transport": 120,
        "accommodation": 300,
        "food": 150,
        "activities": 100,
        "total": 670
      },
      "packingList": [
        { "item": "Passport", "category": "Documents", "isPacked": false }
      ]
    }
    Make sure estimates match typical realistic local rates for the specified budgetTier.
    CRITICAL RULE: For the "category" inside the packingList, you MUST ONLY use one of these exact four words: "Documents", "Clothing", "Gear", or "Other". Do not invent new categories!
  `;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const requestPayload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    };

    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    };

    const data = await fetchWithRetry(url, options);
    const parsedResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!parsedResponseText) {
      throw new Error("Could not extract generation data from response.");
    }

    const clearResult = JSON.parse(parsedResponseText);

    const cleanItinerary = sanitizeItinerary(clearResult.itinerary);

    const newTrip = await Trip.create({
      userId,
      destination,
      durationDays,
      budgetTier,
      interests,
      itinerary: cleanItinerary,
      hotels: clearResult.hotels,
      estimatedBudget: clearResult.estimatedBudget,
      packingList: clearResult.packingList,
    });

    res.status(200).json({ message: "itinerary created.", trip: newTrip });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Error: ${error}` });
  }
});

// * get user specific trips
export const getUsersTrip = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const getTrips = await Trip.find({ userId });
  if (!getTrips) return res.status(400).json({ message: "No Trips Found" });

  res.status(200).json({ tripsCount: getTrips.length, getTrips });
  console.log("from get trips:", userId);
});

// * update trip details
export const updateTripDetails = asyncHandler(async (req, res) => {
  const tripId = req.params.id;
  const userId = req.user.id;
  const exisitingTrip = await Trip.findOne({ _id: tripId, userId });

  if (!exisitingTrip)
    return res.status(400).json({ message: "Cannot find the Trip." });

  const finalDestination = req.body.destination || exisitingTrip.destination;
  const finalDurationDays = req.body.durationDays || exisitingTrip.durationDays;
  const finalBudgetTier = req.body.budgetTier || exisitingTrip.budgetTier;
  const finalInterests = req.body.interests || exisitingTrip.interests;

  const prompt = `
    Create a detailed travel plan for a ${finalDurationDays}-day trip to ${finalDestination}.
    Budget preference is ${finalBudgetTier}. Interests are: ${finalInterests.join(", ")}.

    You must output ONLY a valid JSON object matching this structure:
    {
      "itinerary": [
        {
          "dayNumber": 1,
          "activities": [
            { "title": "Activity name", "description": "Brief text details", "estimatedCostUSD": 20, "timeOfDay": "Morning" }
          ]
        }
      ],
      "hotels": [
        { "name": "Recommended Hotel", "tier": "Budget", "estimatedCostNightUSD": 85, "rating": "4.5/5" }
      ],
      "estimatedBudget": {
        "transport": 120,
        "accommodation": 300,
        "food": 150,
        "activities": 100,
        "total": 670
      },
      "packingList": [
        { "item": "Passport", "category": "Documents", "isPacked": false }
      ]
    }
    Make sure estimates match typical realistic local rates for the specified budgetTier.
    CRITICAL RULE: For the "category" inside the packingList, you MUST ONLY use one of these exact four words: "Documents", "Clothing", "Gear", or "Other". Do not invent new categories!
  `;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const requestPayload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    };

    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    };

    const data = await fetchWithRetry(url, options);
    const parsedResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!parsedResponseText) {
      throw new Error("Could not extract generation data from response.");
    }

    const clearResult = JSON.parse(parsedResponseText);

    const cleanItinerary = sanitizeItinerary(clearResult.itinerary);

    const filter = { _id: tripId, userId };
    const updateData = {
      $set: {
        destination: finalDestination,
        durationDays: finalDurationDays,
        budgetTier: finalBudgetTier,
        interests: finalInterests,
        itinerary: cleanItinerary,
        hotels: clearResult.hotels,
        estimatedBudget: clearResult.estimatedBudget,
        packingList: clearResult.packingList,
      },
    };
    const updateOptions = { new: true };
    const result = await Trip.findOneAndUpdate(
      filter,
      updateData,
      updateOptions,
    );

    if (!result)
      return res.status(400).json({ message: "Couldn't find trip Id" });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Error: ${error}` });
  }
});

// * delete trip details
export const deleteTripDetails = asyncHandler(async (req, res) => {
  const tripId = req.params.id;
  const userId = req.user.id;
  const result = await Trip.findOneAndDelete({ _id: tripId, userId });
  if (!result) return res.status(400).json({ message: "cannot find trip" });

  res.status(200).json({ message: "Deleted the Trip" });
});

// * regenerate specific day
export const regenerateSpecificDay = asyncHandler(async (req, res) => {
  const { dayNumber, userFeedback } = req.body;

  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
  if (!trip) return res.status(404).json({ message: "Trip not found." });

  const prompt = `
    Regenerate ONLY the activities for Day ${dayNumber} of a trip.
    User feedback: "${userFeedback}".
    Output ONLY a valid JSON array (no wrapper object) of activities matching this structure:
    [{ "title": "string", "description": "string", "estimatedCostUSD": 0, "timeOfDay": "Morning" | "Afternoon" | "Evening" }]
    CRITICAL: timeOfDay must be exactly "Morning", "Afternoon", or "Evening" only.
  `;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("No response from Gemini.");

  const newActivities = JSON.parse(rawText);

  const sanitized = sanitizeItinerary([{ activities: newActivities }])[0]
    .activities;

  trip.itinerary = trip.itinerary.map((day) =>
    day.dayNumber === Number(dayNumber)
      ? { ...day.toObject(), activities: sanitized }
      : day,
  );

  await trip.save();
  res.status(200).json(trip);
});

// * add a single activity to a specific day
export const addActivityToDay = asyncHandler(async (req, res) => {
  const { dayNumber, activity } = req.body;

  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
  if (!trip) return res.status(404).json({ message: "Trip not found." });

  const day = trip.itinerary.find((d) => d.dayNumber === Number(dayNumber));
  if (!day)
    return res.status(404).json({ message: "Day not found in itinerary." });

  const [sanitized] = sanitizeItinerary([{ activities: [activity] }]);
  day.activities.push(sanitized.activities[0]);

  await trip.save();
  res.status(200).json(trip);
});

// * remove a single activity from a specific day
export const removeActivityFromDay = asyncHandler(async (req, res) => {
  const { dayNumber, activityId } = req.body;

  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
  if (!trip) return res.status(404).json({ message: "Trip not found." });

  const day = trip.itinerary.find((d) => d.dayNumber === Number(dayNumber));
  if (!day)
    return res.status(404).json({ message: "Day not found in itinerary." });

  const originalCount = day.activities.length;
  day.activities = day.activities.filter(
    (act) => act._id.toString() !== activityId,
  );

  if (day.activities.length === originalCount)
    return res.status(404).json({ message: "Activity not found." });

  await trip.save();
  res.status(200).json(trip);
});

export const togglePackingItem = asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
  if (!trip) return res.status(404).json({ message: "Trip not found." });

  const item = trip.packingList.id(itemId); // Mongoose subdoc lookup by _id
  if (!item)
    return res.status(404).json({ message: "Packing item not found." });

  item.isPacked = !item.isPacked;
  await trip.save();
  res.status(200).json(trip);
});
