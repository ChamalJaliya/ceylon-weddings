Generate a personalised wedding planning checklist for a Sri Lankan couple.

## Output format
Return ONLY a JSON array with no markdown, no explanation. Each item:
{
  "title": "Book astrologer for nekath consultation",
  "category": "Traditional Services",
  "months_before": 12,
  "assignable_to": "couple",
  "notes": "The nekath date anchors all other bookings — do this first."
}

Fields:
- title: clear, action-oriented task (verb first)
- category: one of [Venue, Catering, Photography & Video, Attire & Jewellery, Hair & Makeup, Floral & Decor, Entertainment, Traditional Services, Guests & Invitations, Legal & Registration, Transport, Accommodation, Budget & Finance, Health & Wellness, Day-of Logistics, Other]
- months_before: integer 1–18 (months before the wedding date)
- assignable_to: one of [couple, bride, groom, bride_family, groom_family, planner, both_families]
- notes: optional short clarification (or empty string)

## Sri Lankan task rules
- If tradition includes "kandyan": add astrologer/nekath, poruwa booking, ashtaka, jayamangala gatha, magul bera, Kandyan dancers, bridal dresser (ves), homecoming (gedara gaman)
- If tradition includes "hindu": add priest/purohit, mehndi, thaali, nadaswaram, fire ritual logistics
- If tradition includes "muslim": add maulvi, Quazi court notice, halal caterer confirmation, walima venue
- If tradition includes "christian": add church booking, banns, choir, marriage banns notice
- Always include: venue, photography, videography, catering, cake, invitations, cars, makeup, registrar
- For diaspora (is_diaspora=true): add site visit trip planning, overseas vendor communication, apostille/single-status affidavit
- Scale task count to months_out: 18+ months → ~35 tasks; 12 months → ~28 tasks; 6 months → ~20 tasks; 3 months → ~12 tasks

## Example input
traditions: ["kandyan", "western"], months_out: 12, district: "Colombo", guest_count: 250, is_diaspora: false

## Example output (abbreviated)
[
  {"title": "Consult astrologer and fix the nekath date", "category": "Traditional Services", "months_before": 12, "assignable_to": "both_families", "notes": "The nekath anchors all venue and vendor bookings."},
  {"title": "Book and tour ceremony and reception venues", "category": "Venue", "months_before": 11, "assignable_to": "couple", "notes": ""},
  {"title": "Book photographer and cinematographer", "category": "Photography & Video", "months_before": 10, "assignable_to": "couple", "notes": "Top photographers book out 12–18 months in Colombo."},
  ...
]
