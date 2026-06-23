import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import api from "../api/axios";

const tripSchema = z.object({
  destination: z.string().min(2, "Where are we going?"),
  durationDays: z
    .number()
    .min(1, "Must be at least 1 day")
    .max(30, "Max 30 days"),
  budgetTier: z.enum(["Low", "Medium", "High"]),
  interests: z.string(),
});

type TripFormInputs = z.infer<typeof tripSchema>;

interface CreateTripFormProps {
  onSuccess: () => void;
}

const CreateTripForm = ({ onSuccess }: CreateTripFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TripFormInputs>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      destination: "",
      durationDays: 1,
      budgetTier: "Low",
      interests: "",
    },
  });

  const generateTrip: SubmitHandler<TripFormInputs> = async (data) => {
    const toastId = toast.loading(
      "AI is planning your perfect trip. This may take a moment...",
    );

    try {
      const formattedData = {
        ...data,
        interests: data.interests.split(",").map((item) => item.trim()),
      };

      await api.post("/trips/new-trip", formattedData);

      toast.success("Itinerary Generated!", { id: toastId });
      reset();
      onSuccess();
    } catch (err) {
      console.error("Generation error: ", err);
      let errorMsg = "AI failed to generate trip. Please try again.";

      if (axios.isAxiosError(err)) {
        const rawMessage = err.response?.data?.message || "";
        if (
          rawMessage.includes("ValidationError") ||
          rawMessage.includes("enum")
        ) {
          errorMsg =
            "The AI got a little too creative with the schedule. Let's try again!";
        } else {
          errorMsg = rawMessage || errorMsg;
        }
      }
      toast.error(errorMsg, { id: toastId });
    }
  };

  return (
    <div className="trip-form">
      <h3 className="trip-form__title">Generate New Trip</h3>
      <form className="trip-form__form" onSubmit={handleSubmit(generateTrip)}>
        <section className="trip-form__group">
          <label className="trip-form__label">Where are you going?</label>
          <input
            className="trip-form__input"
            type="text"
            placeholder="e.g., Tokyo, Japan"
            {...register("destination")}
          />
          {errors.destination && (
            <p className="trip-form__error">{errors.destination.message}</p>
          )}
        </section>

        <section className="trip-form__group">
          <label className="trip-form__label">How many days?</label>
          <input
            className="trip-form__input"
            type="number"
            min="1"
            max="30"
            {...register("durationDays", { valueAsNumber: true })}
          />
          {errors.durationDays && (
            <p className="trip-form__error">{errors.durationDays.message}</p>
          )}
        </section>

        <section className="trip-form__group">
          <label className="trip-form__label">Budget Tier</label>
          <select {...register("budgetTier")} className="trip-form__select">
            <option value="Low">Low (Backpacker)</option>
            <option value="Medium">Medium (Standard)</option>
            <option value="High">High (Luxury)</option>
          </select>
          {errors.budgetTier && (
            <p className="trip-form__error">{errors.budgetTier.message}</p>
          )}
        </section>

        <section className="trip-form__group">
          <label className="trip-form__label">What do you want to do?</label>
          <input
            className="trip-form__input"
            type="text"
            placeholder="e.g., beaches, spicy food, hiking"
            {...register("interests")}
          />
          <p className="trip-form__help-text">
            Separate multiple interests with a comma.
          </p>
          {errors.interests && (
            <p className="trip-form__error">{errors.interests.message}</p>
          )}
        </section>

        <button
          type="submit"
          className="trip-form__btn trip-form__btn--primary"
        >
          Plan My Trip
        </button>
      </form>
    </div>
  );
};

export default CreateTripForm;
