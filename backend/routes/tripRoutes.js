import express from "express";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import {
  addActivityToDay,
  deleteTripDetails,
  generateNewTrip,
  getUsersTrip,
  regenerateSpecificDay,
  removeActivityFromDay,
  togglePackingItem,
  updateTripDetails,
} from "../controllers/tripController.js";

const router = express.Router();

// * generate new trip
router.post("/new-trip", protectedRoute, generateNewTrip);

// * get user's trips
router.get("/", protectedRoute, getUsersTrip);

// * update trip
router.put("/:id", protectedRoute, updateTripDetails);

// * delete trip
router.delete("/:id", protectedRoute, deleteTripDetails);

// * regenerate specific day
router.put("/:id/regenerate-day", protectedRoute, regenerateSpecificDay);

// * add activity today
router.patch("/:id/add-activity", protectedRoute, addActivityToDay);

// * remove activity today
router.patch("/:id/remove-activity", protectedRoute, removeActivityFromDay);

// * toggle packing item
router.patch("/:id/toggle-packing", protectedRoute, togglePackingItem);

export default router;
