"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import "vis-timeline/styles/vis-timeline-graph2d.css";
import { Timeline } from "vis-timeline";
import { DataSet } from "vis-data";
import $ from "jquery";
import { demoTracks } from "@/data/data";

const PlaybackMap: React.FC = () => {
  const playbackRef = useRef<any>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    (window as any).$ = $;
    (window as any).jQuery = $;

    const script = document.createElement("script");
    script.src = "/libs/LeafletPlayback.js";
    script.async = true;
    script.onload = () => {
      if (!mapInstance.current) return;
      
      const options = {
        playControl: true,
        speed: 5,
      };
      
      playbackRef.current = new (window as any).L.Playback(
        mapInstance.current,
        [demoTracks.tillicum],
        null,
        options
      );
      
      const marker = new L.Marker([0, 0], {
        icon: L.icon({
          iconUrl: "/marker-icon.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        }),
      }).addTo(mapInstance.current);

      playbackRef.current.setMarker(marker);
    };

    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    if (!timelineRef.current) return;
    const items = new DataSet(
      demoTracks.tillicum.geometry.coordinates.map((point, index) => ({
        id: index,
        content: `Point ${index + 1}`,
        start: new Date(point[2]),
      }))
    );

    const timelineInstance = new Timeline(timelineRef.current, items, {
      showCurrentTime: true,
      zoomable: true,
      moveable: true,
      height: "150px",
    });

    timelineInstance.on("timechange", (event) => {
      if (playbackRef.current) {
        playbackRef.current.setCursor(event.time.getTime());
      }
    });

    setTimeline(timelineInstance);
  }, []);

  const togglePlayback = () => {
    if (playbackRef.current) {
      if (isPlaying) {
        playbackRef.current.stop();
      } else {
        playbackRef.current.start();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div>
      <MapContainer
        center={[23.0225, 72.5714]}
        zoom={14}
        style={{ height: "400px", width: "100%" }}
        whenCreated={(map) => (mapInstance.current = map)}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </MapContainer>

      <div ref={timelineRef} style={{ marginTop: "10px" }} />
      <button onClick={togglePlayback} style={{ marginTop: "10px" }}>
        {isPlaying ? "Pause" : "Play"}
      </button>
    </div>
  );
};

export default PlaybackMap;
