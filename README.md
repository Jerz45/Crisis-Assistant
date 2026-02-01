# Crisis-Assistant
# Flood Crisis Assistant in Germany

A smart AI-based chatbot system built with **Rasa + React JS** to support flood emergencies in Germany by providing verified safety guidance, hospital recommendations, and escalation support.

**Project Features**

- Flood emergency chatbot for Germany
- Recognizes simple user inputs:
  - Location (Berlin, Munich, Hamburg)
  - Water level (ankle, knee, waist, above)
  - Severity (low, medium, high)
  - Injuries / trapped status
- Provides verified flood safety instructions
- Suggests nearest hospitals and shelters
- Escalates to human support when critical
- 
**Tech Stack**
| Layer | Technology |
| Frontend | React JS |
| Backend AI | Rasa Open Source |
| Custom Logic | Rasa Action Server (Python) |
| Dataset Storage | Verified JSON files |

**Project Structure**
crisis-assistant/
│
├── actions/
│ └── actions.py
│
├── data/
│ ├── nlu.yml
│ ├── rules.yml
│ └── stories.yml
│
├── domain.yml
├── config.yml
│
├── verified_data/
│ ├── flood_info_de.json
│ ├── facilities.json
│ └── guidance.json
│
└── ui/
└── React Chat Interface

## Run Locally
**Backend**
-->powershell
.venv\Scripts\Activate.ps1
rasa train
rasa run actions
rasa run --enable-api --cors "*" --debug
**Frontend**
cd ui
npm start

