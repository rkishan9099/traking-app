/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import $ from "jquery";



import L from 'leaflet';
import { demoTracks } from '@/data/data';
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: '/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Generate demo locations in a more realistic path
const generateDemoData = () => {
    const data: any = [];

    demoTracks.tillicum.geometry.coordinates.forEach((coord, index) => {
        data.push({
            id: index + 1,
            lat: coord[1],
            lng: coord[0],
            time: new Date(demoTracks.tillicum.properties.time[index])
        });
    });

    return data;
};

const MarkerComponent = ({ position, timestamp }: { position: [number, number], timestamp: Date }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(position, map.getZoom());
    }, [position, map]);

    return (
        <Marker position={position} icon={icon}>
            <Popup>
                {timestamp.toLocaleString()}
            </Popup>
        </Marker>
    );
};

const Tracking = () => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [locations] = useState(generateDemoData());
    const [currentLocation, setCurrentLocation] = useState(locations[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const timelineInstance = useRef<Timeline | null>(null);
    const playInterval = useRef<NodeJS.Timeout>();
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

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
        if (timelineRef.current) {
            const items = new DataSet(
                locations.map(loc => ({
                    id: loc.id,
                    content: '',
                    start: loc.time
                }))
            );

            const options = {
                height: '100px',
                start: locations[0].time,
                end: locations[locations.length - 1].time,
                showCurrentTime: true,
                showMajorLabels: true,
                showMinorLabels: true,
                timeAxis: { scale: 'minute', step: 1 },
                format: {
                    minorLabels: {
                        minute: 'HH:mm',
                        hour: 'HH:mm'
                    },
                    majorLabels: {
                        minute: 'ddd D MMMM',
                        hour: 'ddd D MMMM'
                    }
                }
            };

            timelineInstance.current = new Timeline(timelineRef.current, items, options);

            timelineInstance.current.on('select', (properties) => {
                const selectedId = properties.items[0];
                const selected = locations.find(loc => loc.id === selectedId);
                if (selected) {
                    setCurrentLocation(selected);
                }
            });
        }

        return () => {
            if (playInterval.current) {
                clearInterval(playInterval.current);
            }
        };
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            if (playInterval.current) {
                clearInterval(playInterval.current);
            }
        } else {
            const currentIndex = locations.findIndex(loc => loc.id === currentLocation.id);
            let nextIndex = currentIndex;

            playInterval.current = setInterval(() => {
                nextIndex++;
                if (nextIndex >= locations.length) {
                    clearInterval(playInterval.current);
                    setIsPlaying(false);
                    return;
                }
                setCurrentLocation(locations[nextIndex]);
                timelineInstance.current?.setSelection(locations[nextIndex].id);
            }, 1000);
        }
        setIsPlaying(!isPlaying);
    };


    // Calculate the path for polyline
    const positions = locations.map(loc => [loc.lat, loc.lng] as [number, number]);

    return (
        <div className="flex flex-col h-screen">
            <div className="p-4 bg-gray-100 dark:bg-gray-800">
                <h1 className="text-xl font-bold">GPS Tracking</h1>
                <div className="text-sm">
                    {currentLocation.time.toLocaleString()}
                </div>
            </div>
            <div className="flex-1">
                <MapContainer
                    center={[currentLocation.lat, currentLocation.lng]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    whenReady={(map) => {
                       setMapInstance(map);
                    }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MarkerComponent
                        position={[currentLocation.lat, currentLocation.lng]}
                        timestamp={currentLocation.time}
                    />
                    <Polyline
                        positions={positions}
                        color="blue"
                        weight={3}
                        opacity={0.6}
                    />
                </MapContainer>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800">
                <button
                    onClick={togglePlay}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
                <div className="text-sm">
                    Demo GPS Tracks
                </div>
            </div>
            <div ref={timelineRef} className="h-32" />
        </div>
    );
};

export default Tracking;