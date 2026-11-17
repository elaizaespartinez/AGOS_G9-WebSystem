// Offline safety guide used when no AI provider is available.
// Written in the same lightweight markdown the chat window renders.
export function getLocalReply(messages, hotline) {
    const latestMessage = messages.at(-1)?.content.toLowerCase() || "";

    if (/urgent|emergency|trapped|danger|help me|rising fast/.test(latestMessage)) {
        return `> **If you are in immediate danger, call 911 or your local emergency hotline now.**

1. **Move to a safe, higher location** if you can do so safely.
2. **Do not walk or drive through floodwater.**
3. **Stay away** from damaged structures, loose power lines, and fast-moving water.
4. **Follow instructions** from PAGASA, PHIVOLCS, NDRRMC, and your LGU or barangay DRRM office.

For local assistance, call ${hotline}.`;
    }

    if (/flood|rain|water/.test(latestMessage)) {
        return `## Before or during heavy rain

1. **Charge your devices.** Fully charge your phone and power bank.
2. **Stock essentials.** Prepare drinking water, food, and medicines.
3. **Move valuables up.** Raise documents and appliances, and keep a go-bag ready.
4. **Know your way out.** Identify your evacuation center and a safe route.
5. **Monitor advisories.** Watch PAGASA and your LGU announcements.

> **Never walk or drive through floodwater.**`;
    }

    if (/typhoon|bagyo|wind|storm/.test(latestMessage)) {
        return `## Typhoon preparedness

1. **Pack a go-bag.** Water, food, medicines, IDs, a flashlight, batteries, and a power bank.
2. **Secure your home.** Tie down or bring in loose objects.
3. **Stay indoors** away from windows during strong winds.
4. **Follow advisories** from PAGASA, NDRRMC, and your LGU, and evacuate when told to.`;
    }

    if (/earthquake|lindol/.test(latestMessage)) {
        return `## During an earthquake

1. **Drop, Cover, and Hold On.** Get under a sturdy table and protect your head.
2. **Stay away** from windows and heavy objects.
3. **Evacuate calmly** after the shaking stops.
4. **Expect aftershocks.** Follow PHIVOLCS and LGU advisories.`;
    }

    if (/fire|sunog/.test(latestMessage)) {
        return `> **Leave immediately and call the fire service from a safe place.**

1. **Use the safest exit** and stay low under smoke.
2. **Do not use elevators.**
3. **Do not re-enter** until authorities declare the area safe.`;
    }

    if (/landslide|guho/.test(latestMessage)) {
        return `## Landslide safety

1. **Move away** from slopes, steep hills, and flowing mud or debris.
2. **Do not cross** a damaged road or bridge.
3. **Follow evacuation instructions** from your barangay or LGU DRRM office.`;
    }

    return `I can help with floods, typhoons, earthquakes, landslides, fires, and disaster preparedness.

> **For urgent danger, call 911 or your local emergency hotline first.**

**Official sources:** PAGASA, PHIVOLCS, NDRRMC, and your LGU or barangay DRRM office. For local assistance, call ${hotline}.`;
}