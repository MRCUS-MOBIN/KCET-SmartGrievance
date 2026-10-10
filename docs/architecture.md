# Architecture
React frontend -> Express API -> MongoDB
Express API -> Python FastAPI NLP service

Complaint flow:
1. Student chooses anonymous or identified mode.
2. Submit complaint text, category (optional), and location (optional).
3. Backend validates input and asks NLP service for category suggestion.
4. Complaint is saved with a random tracking ID.
5. Authorized staff review, route, and update status.
6. Student checks status using tracking ID.

NLP predictions are advisory. Staff must be able to correct them; sensitive cases need a separate, approved confidential workflow.
