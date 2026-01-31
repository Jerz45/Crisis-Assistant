import json, os, random
from typing import Any, Dict, List, Optional, Text

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "verified_data")

FACILITIES_PATH = os.path.join(DATA_DIR, "facilities.json")
FLOOD_INFO_PATH = os.path.join(DATA_DIR, "flood_info_de.json")
GUIDANCE_PATH = os.path.join(DATA_DIR, "guidance.json")


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def _norm(s: Optional[str]) -> str:
    return (s or "").strip().lower()

def _pick_lines(lines: List[str], n: int = 3) -> List[str]:
    if not lines:
        return []
    if len(lines) <= n:
        return lines
    return random.sample(lines, n)


class ActionFindNearbyFacilities(Action):
    def name(self) -> Text:
        return "action_find_nearby_facilities"

    def run(self, dispatcher, tracker, domain):
        facilities = _load_json(FACILITIES_PATH)
        location = tracker.get_slot("location")

        hospitals = [f for f in facilities if _norm(f.get("type")) == "hospital"]
        shelters  = [f for f in facilities if _norm(f.get("type")) == "shelter"]

        # If user explicitly asks hospital but no location -> random hospital
        if not location:
            if hospitals:
                h = random.choice(hospitals)
                dispatcher.utter_message(text=f"🏥 Hospital (random): {h['name']} — {h['address']}")
                dispatcher.utter_message(text="Send your city/postcode to match a nearer one.")
            else:
                dispatcher.utter_message(text="I have no hospital data available right now.")
            return []

        loc = _norm(location)

        hosp_matches = [h for h in hospitals if _norm(h.get("city")) in loc or loc in _norm(h.get("city"))]
        shel_matches = [s for s in shelters if _norm(s.get("city")) in loc or loc in _norm(s.get("city"))]

        msg = []
        if hosp_matches:
            h = hosp_matches[0]
            msg.append(f"🏥 Nearest hospital for {location}: {h['name']} — {h['address']}")
        else:
            if hospitals:
                h = random.choice(hospitals)
                msg.append(f"🏥 No exact match. Hospital (random): {h['name']} — {h['address']}")

        if shel_matches:
            s = shel_matches[0]
            msg.append(f"🏠 Shelter for {location}: {s['name']} — {s['address']}")

        if msg:
            dispatcher.utter_message(text="\n".join(msg))
        else:
            dispatcher.utter_message(text=f"I couldn’t find facilities for '{location}'. Try Berlin/Munich/Hamburg/Cologne.")
        return []


class ActionFloodRiskAssessment(Action):
    def name(self) -> Text:
        return "action_flood_risk_assessment"

    def run(self, dispatcher, tracker, domain):
        info = _load_json(FLOOD_INFO_PATH)

        severity = _norm(tracker.get_slot("severity"))
        water_level = _norm(tracker.get_slot("water_level"))
        injuries = tracker.get_slot("injuries")
        trapped = tracker.get_slot("trapped")

        # severity advice
        sev_tips = info.get("severity", {}).get(severity, [])
        # water advice
        wl_tips = info.get("water_level_advice", {}).get(water_level, [])
        # injuries advice
        inj_tips = info.get("injuries_yes", []) if injuries is True else info.get("injuries_no", [])
        # trapped advice
        trapped_tips = info.get("trapped", []) if trapped is True else info.get("precautions", [])

        out = []
        if severity:
            out.append(f"📌 Severity ({severity}):")
            out += [f"• {t}" for t in _pick_lines(sev_tips, 3)]

        if water_level:
            out.append(f"🌊 Water level ({water_level}):")
            out += [f"• {t}" for t in _pick_lines(wl_tips, 2)]

        out.append("🩹 Injuries:")
        out += [f"• {t}" for t in _pick_lines(inj_tips, 2)]

        if trapped is True:
            out.append("🚨 Trapped:")
            out += [f"• {t}" for t in _pick_lines(trapped_tips, 3)]
        else:
            out.append("✅ Precautions:")
            out += [f"• {t}" for t in _pick_lines(trapped_tips, 3)]

        dispatcher.utter_message(text="\n".join(out))
        return []


class ActionLocationGuidance(Action):
    def name(self) -> Text:
        return "action_location_guidance"

    def run(self, dispatcher, tracker, domain):
        # For ask_instructions, give general precautions from flood_info_de.json
        info = _load_json(FLOOD_INFO_PATH)
        tips = info.get("precautions", [])
        dispatcher.utter_message(text="✅ Safety checklist:")
        for t in _pick_lines(tips, 4):
            dispatcher.utter_message(text=f"• {t}")
        return []

class ActionFallback(Action):
    def name(self) -> Text:
        return "action_fallback"

    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(
            text="⚠️ I didn’t understand. Please reply with:\n"
                 "• City/postcode (e.g., Berlin, 10243)\n"
                 "• Severity: low / medium / high\n"
                 "• Water level: ankle / knee / waist / above\n"
                 "• nearest hospital\n"
                 "If life-threatening call 112."
        )
        return []