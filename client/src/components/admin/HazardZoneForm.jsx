
import { X } from "lucide-react";

import {
    hazardSeverities,
    hazardStatuses,
    hazardTypes,
} from "../../data/hazardZonesData";

const emptyZone = {
    title: "",
    type: "Flood",
    severity: "Moderate",
    description: "",
    latitude: "",
    longitude: "",
    radius: 500,
    radiusUnit: "meters",
    status: "Active",
    expiresAt: "",
    location: "Selected map location",
};

export const defaultHazardZone = emptyZone;

export default function HazardZoneForm({
    value,
    editing,
    saving,
    onChange,
    onSubmit,
    onCancel,
    onClearPoint,
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            {/* Form header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="font-extrabold text-secondary">
                        {editing ? "Edit hazard zone" : "Create hazard zone"}
                    </h2>

                    <p className="mt-1 text-xs text-text/60">
                        All changes remain in this frontend mockup.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onCancel}
                    aria-label="Close hazard zone form"
                    className="rounded-lg p-2 text-text/50 hover:bg-background"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Hazard title */}
            <label className="block text-sm font-semibold text-secondary">
                Hazard title / name

                <input
                    required
                    value={value.title}
                    onChange={(event) =>
                        onChange({ title: event.target.value })
                    }
                    className="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="e.g. Sta. Rita road flooding"
                />
            </label>

            {/* Hazard type and severity */}
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-secondary">
                    Hazard type

                    <select
                        value={value.type}
                        onChange={(event) =>
                            onChange({ type: event.target.value })
                        }
                        className="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
                    >
                        {hazardTypes.map((type) => (
                            <option key={type}>{type}</option>
                        ))}
                    </select>
                </label>

                <label className="text-sm font-semibold text-secondary">
                    Severity

                    <select
                        value={value.severity}
                        onChange={(event) =>
                            onChange({ severity: event.target.value })
                        }
                        className="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
                    >
                        {hazardSeverities.map((severity) => (
                            <option key={severity}>{severity}</option>
                        ))}
                    </select>
                </label>
            </div>

            {/* Description */}
            <label className="block text-sm font-semibold text-secondary">
                Description

                <textarea
                    required
                    value={value.description}
                    onChange={(event) =>
                        onChange({ description: event.target.value })
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-lg border border-gray-300 p-3 text-sm"
                    placeholder="Describe the observed hazard and its likely impact."
                />
            </label>

            {/* Coordinates */}
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-secondary">
                    Center latitude

                    <input
                        required
                        type="number"
                        step="any"
                        value={value.latitude}
                        onChange={(event) =>
                            onChange({ latitude: event.target.value })
                        }
                        className="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
                    />
                </label>

                <label className="text-sm font-semibold text-secondary">
                    Center longitude

                    <input
                        required
                        type="number"
                        step="any"
                        value={value.longitude}
                        onChange={(event) =>
                            onChange({ longitude: event.target.value })
                        }
                        className="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
                    />
                </label>
            </div>

            {/* Radius and unit */}
            <div className="flex items-end gap-3">
                <label className="min-w-0 flex-1 text-sm font-semibold text-secondary">
                    Radius

                    <input
                        required
                        min="1"
                        type="number"
                        step="any"
                        value={value.radius}
                        onChange={(event) =>
                            onChange({ radius: event.target.value })
                        }
                        className="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
                    />
                </label>

                <label className="w-36 text-sm font-semibold text-secondary">
                    Unit

                    <select
                        value={value.radiusUnit}
                        onChange={(event) =>
                            onChange({ radiusUnit: event.target.value })
                        }
                        className="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
                    >
                        <option value="meters">Meters</option>
                        <option value="kilometers">Kilometers</option>
                    </select>
                </label>
            </div>

            {/* Status and expiration */}
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-secondary">
                    Status

                    <select
                        value={value.status}
                        onChange={(event) =>
                            onChange({ status: event.target.value })
                        }
                        className="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
                    >
                        {hazardStatuses.map((status) => (
                            <option key={status}>{status}</option>
                        ))}
                    </select>
                </label>

                <label className="text-sm font-semibold text-secondary">
                    Expiration date/time

                    <input
                        type="datetime-local"
                        value={value.expiresAt}
                        onChange={(event) =>
                            onChange({ expiresAt: event.target.value })
                        }
                        className="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
                    />
                </label>
            </div>

            {/* Selected coordinates preview */}
            <p className="rounded-lg bg-background px-3 py-2 text-xs text-text/60">
                Center: {Number(value.latitude || 0).toFixed(5)},{" "}
                {Number(value.longitude || 0).toFixed(5)}
                {" · "}
                The circle updates as you edit the radius.
            </p>

            {/* Form actions */}
            <div className="flex flex-wrap justify-end gap-2">
                <button
                    type="button"
                    onClick={onClearPoint}
                    className="mr-auto text-xs font-bold text-text/60 hover:text-primary"
                >
                    Clear selected point
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="min-h-10 rounded-lg border border-gray-200 px-4 text-sm font-bold text-secondary"
                >
                    Cancel
                </button>

                <button
                    disabled={saving}
                    className="min-h-10 rounded-lg bg-primary px-4 text-sm font-bold text-white disabled:opacity-60"
                >
                    {saving
                        ? "Saving..."
                        : editing
                          ? "Update zone"
                          : "Create zone"}
                </button>
            </div>
        </form>
    );
}
