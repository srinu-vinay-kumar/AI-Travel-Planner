import FuzzyText from "../components/TypeEffects/FuzzyText";

const NotFound = () => {
  return (
    <div className="not-found">
      <div>
        <FuzzyText
          fuzzRange={30}
          baseIntensity={0.2}
          hoverIntensity={0.5}
          color="#ffffff"
        >
          404
        </FuzzyText>
      </div>

      <div>
        <FuzzyText
          fuzzRange={30}
          baseIntensity={0.2}
          hoverIntensity={0.5}
          color="#ffffff"
        >
          Not Found
        </FuzzyText>
      </div>
    </div>
  );
};

export default NotFound;
