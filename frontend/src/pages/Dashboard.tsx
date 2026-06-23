import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeftLong, FaTrash } from "react-icons/fa6";
import { GrRefresh } from "react-icons/gr";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import CreateTripForm from "../components/CreateTripForm";
import Logo from "../assets/image.svg";
import SplitText from "../components/TypeEffects/SplitText";

// --- Interfaces ---
interface Activity {
  _id?: string;
  title: string;
  description: string;
  estimatedCostUSD: number;
  timeOfDay: string;
}
interface ItineraryDay {
  dayNumber: number;
  activities: Activity[];
}
interface PackingItem {
  _id?: string;
  item: string;
  category: string;
  isPacked: boolean;
}

interface Hotel {
  _id?: string;
  name: string;
  tier: string;
  estimatedCostNightUSD: number;
  rating: string;
}
interface Trip {
  _id: string;
  destination: string;
  durationDays: number;
  budgetTier: string;
  interests?: string[];
  itinerary: ItineraryDay[];
  packingList: PackingItem[];
  hotels: Hotel[];
  estimatedBudget: {
    total: number;
    accommodation: number;
    food: number;
    activities: number;
    transport: number;
  };
}

const Dashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [newActivityName, setNewActivityName] = useState("");

  const fetchTrips = useCallback(async () => {
    try {
      const res = await api.get("/trips");
      setTrips(res.data.getTrips);
    } catch {
      toast.error("Session expired. Please log in again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTrips = async () => {
      await fetchTrips();
    };

    loadTrips();
  }, [fetchTrips]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm("Delete this trip? This cannot be undone.")) return;

    try {
      await api.delete(`/trips/${tripId}`);
      setTrips((prev) => prev.filter((t) => t._id !== tripId));
      if (selectedTrip?._id === tripId) {
        setSelectedTrip(null);
      }
      toast.success("Trip deleted.");
    } catch {
      toast.error("Failed to delete trip.");
    }
  };

  const handleTogglePacking = async (itemId: string) => {
    if (!selectedTrip) return;

    const updatedPacking = selectedTrip.packingList.map((item) =>
      item._id === itemId ? { ...item, isPacked: !item.isPacked } : item,
    );
    const updatedTrip = { ...selectedTrip, packingList: updatedPacking };
    setSelectedTrip(updatedTrip);
    setTrips((prev) =>
      prev.map((t) => (t._id === updatedTrip._id ? updatedTrip : t)),
    );

    try {
      await api.patch(`/trips/${selectedTrip._id}/toggle-packing`, { itemId });
    } catch {
      toast.error("Failed to update packing list.");
      fetchTrips();
    }
  };

  const handleAddActivity = async (dayNum: number) => {
    if (!newActivityName.trim() || !selectedTrip) return;
    try {
      const res = await api.patch(`/trips/${selectedTrip._id}/add-activity`, {
        dayNumber: dayNum,
        activity: {
          title: newActivityName,
          description: "Added by traveler",
          estimatedCostUSD: 0,
          timeOfDay: "Afternoon",
        },
      });
      setSelectedTrip(res.data);
      setNewActivityName("");
      setTrips((prev) =>
        prev.map((t) => (t._id === res.data._id ? res.data : t)),
      );
    } catch {
      toast.error("Failed to add activity.");
    }
  };

  const handleRegenerate = async (dayNum: number) => {
    const fb = prompt("What would you like to change about this day?");
    if (!fb) return;
    try {
      const r = await api.put(`/trips/${selectedTrip!._id}/regenerate-day`, {
        dayNumber: dayNum,
        userFeedback: fb,
      });
      setSelectedTrip(r.data);
      setTrips((prev) => prev.map((t) => (t._id === r.data._id ? r.data : t)));
    } catch {
      toast.error("Failed to regenerate day.");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <img src={Logo} alt="Logo" className="dashboard__logo" />
        <button onClick={handleLogout} className="dashboard__logout-btn">
          Logout
        </button>
      </header>

      {user && (
        <div className="dashboard__welcome">
          <div className="dashboard__greeting">
            <span className="dashboard__greeting-text">Welcome,</span>
            <SplitText
              tag="span"
              text={`${user.name.firstName} ${user.name.lastName}`}
              className="dashboard__username"
              delay={50}
              duration={3}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="left"
            />
          </div>
        </div>
      )}

      <main className="dashboard__main">
        {/* Trip creation form */}
        <aside className="dashboard__sidebar">
          <CreateTripForm onSuccess={fetchTrips} />
        </aside>
        {/* Trip list or detail view */}
        <section className="dashboard__content">
          {selectedTrip ? (
            /* --- Detail View --- */
            <div className="trip-detail">
              <div className="trip-detail__nav">
                <button
                  className="trip-detail__back-btn"
                  onClick={() => setSelectedTrip(null)}
                  aria-label="Go Back to Trips"
                >
                  <FaArrowLeftLong />
                </button>
                {/* Delete button */}
                <button
                  onClick={() => handleDeleteTrip(selectedTrip._id)}
                  className="trip-detail__delete-btn"
                >
                  Delete Trip
                </button>
              </div>

              <div className="trip-detail__header">
                <h2 className="trip-detail__title">
                  {selectedTrip.destination}
                </h2>
                <p className="trip-detail__subtitle">
                  {selectedTrip.durationDays} days · {selectedTrip.budgetTier}{" "}
                  budget
                </p>
              </div>

              {/* Itinerary */}
              <div className="trip-detail__itinerary">
                {selectedTrip.itinerary.map((day) => (
                  <div className="itinerary-day" key={day.dayNumber}>
                    <h4 className="itinerary-day__title">
                      Day {day.dayNumber}
                    </h4>
                    <div className="itinerary-day__activities">
                      {day.activities.map((act, i) => (
                        <div className="activity" key={act._id ?? i}>
                          <div className="activity__info">
                            <span className="activity__title">{act.title}</span>
                            <span className="activity__time">
                              {act.timeOfDay}
                            </span>
                          </div>
                          <button
                            className="activity__remove-btn"
                            aria-label="Remove single activity"
                            onClick={async () => {
                              try {
                                const r = await api.patch(
                                  `/trips/${selectedTrip._id}/remove-activity`,
                                  {
                                    dayNumber: day.dayNumber,
                                    activityId: act._id,
                                  },
                                );
                                setSelectedTrip(r.data);
                                setTrips((prev) =>
                                  prev.map((t) =>
                                    t._id === r.data._id ? r.data : t,
                                  ),
                                );
                              } catch {
                                toast.error("Failed to remove activity.");
                              }
                            }}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Add activity inline */}
                    <div className="itinerary-day__actions">
                      <input
                        className="input"
                        type="text"
                        value={newActivityName}
                        placeholder="New activity..."
                        onChange={(e) => setNewActivityName(e.target.value)}
                      />
                      <button
                        className="itinerary-day__add-btn"
                        onClick={() => handleAddActivity(day.dayNumber)}
                      >
                        Add
                      </button>
                      <button
                        className="itinerary-day__regen-btn"
                        onClick={() => handleRegenerate(day.dayNumber)}
                      >
                        <GrRefresh /> Regenerate
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hotels */}
              <div className="trip-detail__hotels">
                <h3 className="trip-detail__section-title">
                  Recommended Hotels
                </h3>
                <div className="hotel-list">
                  {selectedTrip.hotels && selectedTrip.hotels.length > 0 ? (
                    selectedTrip.hotels.map((hotel, i) => (
                      <div className="hotel-card" key={hotel._id ?? i}>
                        <div className="hotel-card__info">
                          <h4 className="hotel-card__name">{hotel.name}</h4>
                          <span className="hotel-card__tier">{hotel.tier}</span>
                        </div>
                        <div className="hotel-card__meta">
                          <span className="hotel-card__cost">
                            ${hotel.estimatedCostNightUSD}
                            <span className="hotel-card__cost-label">
                              /night
                            </span>
                          </span>
                          <span className="hotel-card__rating">
                            ⭐ {hotel.rating}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="trip-detail__empty">
                      No hotel suggestions available.
                    </p>
                  )}
                </div>
              </div>

              {/* Estimated Budget */}
              <div className="trip-detail__budget">
                <h3 className="trip-detail__section-title">Estimated Budget</h3>
                <div className="budget-breakdown">
                  <div className="budget-breakdown__row">
                    <span className="budget-breakdown__label">Transport</span>
                    <span className="budget-breakdown__value">
                      ${selectedTrip.estimatedBudget.transport}
                    </span>
                  </div>
                  <div className="budget-breakdown__row">
                    <span className="budget-breakdown__label">
                      Accommodation
                    </span>
                    <span className="budget-breakdown__value">
                      ${selectedTrip.estimatedBudget.accommodation}
                    </span>
                  </div>
                  <div className="budget-breakdown__row">
                    <span className="budget-breakdown__label">Food</span>
                    <span className="budget-breakdown__value">
                      ${selectedTrip.estimatedBudget.food}
                    </span>
                  </div>
                  <div className="budget-breakdown__row">
                    <span className="budget-breakdown__label">Activities</span>
                    <span className="budget-breakdown__value">
                      ${selectedTrip.estimatedBudget.activities}
                    </span>
                  </div>
                  <div className="budget-breakdown__row budget-breakdown__row--total">
                    <span className="budget-breakdown__label">Total</span>
                    <span className="budget-breakdown__value">
                      ${selectedTrip.estimatedBudget.total}
                    </span>
                  </div>
                </div>
              </div>

              {/* Packing list */}
              <div className="trip-detail__packing">
                <h3 className="trip-detail__section-title">🎒 Packing</h3>
                <div className="packing-list">
                  {selectedTrip.packingList.map((item) => (
                    <label className="packing-item" key={item._id}>
                      <input
                        className="packing-item__checkbox"
                        type="checkbox"
                        checked={item.isPacked}
                        onChange={() => handleTogglePacking(item._id!)}
                      />
                      <span
                        className={`packing-item__name ${item.isPacked ? "packing-item__name--packed" : ""}`}
                      >
                        {item.item}
                      </span>
                      <span className="packing-item__category">
                        [{item.category}]
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* --- List View --- */
            <div className="trip-list">
              <h2 className="trip-list__title">My Trips</h2>
              {trips.length === 0 ? (
                <div className="trip-list__empty">
                  <p>No trips yet. Create one to get started!</p>
                </div>
              ) : (
                <div className="trip-list__grid">
                  {trips.map((t) => (
                    <div className="trip-card" key={t._id}>
                      <div onClick={() => setSelectedTrip(t)}>
                        <div className="trip-card__content">
                          <h3 className="trip-card__title">{t.destination}</h3>
                          <p className="trip-card__details">
                            {t.durationDays} days · {t.budgetTier} budget
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrip(t._id);
                        }}
                        className="trip-detail__delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
