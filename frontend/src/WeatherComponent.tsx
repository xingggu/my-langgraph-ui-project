import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";

const WeatherComponent = ({ city }: { city: string }) => {
  const { submit } = useStreamContext();

  return (
    <div className="bg-blue-100 p-3 rounded mt-2">
      <div>🌦️ Weather in {city}</div>
      <button
        className="mt-2 px-2 py-1 bg-blue-500 text-white rounded"
        onClick={() => {
          submit({
            messages: [{ type: "human", content: `What's the weather in ${city}?` }],
          });
        }}
      >
        🔁 Retry
      </button>
    </div>
  );
};

export default WeatherComponent;
