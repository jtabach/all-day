import React, { useEffect, useState } from "react";
import MomentList from "./MomentList";

function App() {
  const initialFilters = {
    minSerial: null,
    maxSerial: null,
  };

  const [moments, setMoments] = useState([]);
  const [filters, setFilters] = useState(initialFilters);

  const [minSerial, setMinSerial] = useState("");
  const [maxSerial, setMaxSerial] = useState("");

  const updateFilters = () => {
    setFilters({
      minSerial,
      maxSerial,
    });
  };

  const callBackendAPI = async () => {
    const response = await fetch("/moments", {
      method: "POST",
      body: JSON.stringify({ filters }),
      headers: { "Content-type": "application/json" },
    });
    const body = await response.json();

    if (response.status !== 200) {
      throw Error("err", body.message);
    }
    return body;
  };
  useEffect(() => {
    const getMoments = () => {
      callBackendAPI()
        .then((res) => {
          console.log(res);
          setMoments(res);
        })
        .catch((err) => console.log(err));
    };
    const intervalId = setInterval(() => {
      getMoments();
    }, 1000);
    getMoments();

    return () => clearInterval(intervalId); //This is important
  }, [filters]);

  return (
    <div>
      <div>Min Serial: </div>
      <input
        type="number"
        min={parseInt(maxSerial - 100) > 1 ? maxSerial - 100 : 1}
        value={minSerial}
        onChange={(e) => setMinSerial(e.target.value)}
      />
      <div>Max Serial: </div>
      <input
        type="number"
        min={minSerial}
        max={parseInt(minSerial) + 100}
        value={maxSerial}
        onChange={(e) => setMaxSerial(e.target.value)}
      />
      <div>
        <button onClick={updateFilters}>Apply filters</button>
      </div>
      {moments && moments.length ? (
        <MomentList moments={moments} />
      ) : (
        <div>Failing to load moments</div>
      )}
    </div>
  );
}

export default App;
