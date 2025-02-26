import React, { useState } from "react";

function EventTile({ eventID }) {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className="event-tile">
            <h3>{event.title}</h3>
            <p>{event.date}</p>
            <button onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? "Hide Details" : "Show Details"}
            </button>
            {showDetails && (
                <div>
                    <p>{event.description}</p>
                    <p>{event.location}</p>
                </div>
            )}
        </div>
    );
}