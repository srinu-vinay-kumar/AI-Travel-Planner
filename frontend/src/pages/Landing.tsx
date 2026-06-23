import { useNavigate } from "react-router-dom";

import Logo from "../assets/image.svg";

const Landing = () => {
  const navigate = useNavigate();
  const isLoggedIn = false;

  const handleGenerateClick = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <main className="landing__page">
      <nav className="landing__navbar">
        <img src={Logo} alt="Trao Logo" />
        <button
          type="button"
          className="landing__login-btn"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </nav>
      <section className="landing__hero">
        <h2 className="landing__hero__heading">
          Design your dream escape in seconds.
        </h2>
        <p className="landing__hero__desc">
          Ditch the endless browser tabs and spreadsheets. Tell our AI your
          destination, budget, and vibe—we'll instantly hand you a personalized
          day-by-day itinerary, hotel matches, and a weather-smart packing list.
        </p>
        <button
          type="button"
          className="landing__hero__btn"
          onClick={handleGenerateClick}
        >
          Generate My Itinerary
        </button>
      </section>
    </main>
  );
};

export default Landing;
