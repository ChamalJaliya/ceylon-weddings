Generate a detailed wedding budget estimate in Sri Lankan Rupees (LKR) for a Sri Lankan couple.

## Output format
Return ONLY valid JSON with no markdown, no explanation:
{
  "total_lkr": { "min": 2000000, "max": 3500000 },
  "total_usd_approx": { "min": 6500, "max": 11500 },
  "disclaimer": "These are market-rate estimates for 2025. Actual costs vary by vendor, season, and negotiation. Get quotes from vendors on Ceylon Weddings for accurate pricing.",
  "breakdown": [
    {
      "category": "Venue & Hall",
      "min_lkr": 400000,
      "max_lkr": 800000,
      "pct_of_total": 22,
      "notes": "Colombo hotel ballrooms range LKR 400k–1.2M for 200–300 guests."
    }
  ]
}

## LKR benchmark data (2025)

### Venue & Hall
- Budget halls (outstations): LKR 80k–200k
- Mid hotel / function hall (Colombo): LKR 300k–700k
- 5-star hotel (Colombo): LKR 800k–2M+
- Destination resort: LKR 500k–3M+

### Catering (per plate)
- Simple buffet: LKR 2,500–4,000/person
- Mid hotel buffet: LKR 4,500–8,000/person
- 5-star hotel: LKR 9,000–15,000/person
- Halal catering adds 10–15%

### Photography
- Amateur / new: LKR 50k–120k
- Mid-range: LKR 150k–350k
- Premium: LKR 400k–800k+

### Videography / cinematography
- Mid-range: LKR 100k–250k
- Premium: LKR 300k–600k+

### Bridal wear (saree / gown purchase or hire)
- Purchase: LKR 30k–300k+
- Hire: LKR 15k–80k
- Groom suit hire/purchase: LKR 20k–100k

### Jewellery hire (thaali, necklace sets)
- LKR 30k–200k+ depending on gold weight or hire rate

### Hair & Makeup (bridal)
- LKR 30k–120k (full day, trials included)

### Bridal dresser (ves for Kandyan)
- LKR 20k–60k

### Floral & Decor
- Simple: LKR 100k–250k
- Mid-range: LKR 300k–600k
- Elaborate / theme: LKR 700k–2M+

### Wedding Cake
- LKR 25k–150k depending on tiers and design

### Entertainment
- DJ: LKR 40k–120k
- Live band: LKR 80k–250k
- Kandyan dancers (full troupe): LKR 60k–150k
- Magul bera / Hewisi: LKR 30k–80k
- Nadaswaram (Tamil): LKR 40k–100k

### Traditional services
- Astrologer: LKR 10k–30k
- Poruwa ceremony hire: LKR 15k–50k
- Ashtaka / jayamangala gatha: LKR 20k–60k
- Mehndi artist: LKR 15k–50k

### Invitations & printing
- LKR 15k–80k (200 guests)
- E-invitations: LKR 5k–20k

### Wedding cars (decorated)
- LKR 20k–60k per car (typically 2–4 cars)

### Marriage registration fees
- LKR 5k–15k depending on type

### Miscellaneous / contingency buffer
- 10–15% of total is strongly recommended

## District context
- Colombo / Gampaha: highest rates
- Kandy / Galle: 10–20% lower
- Outstations (Jaffna, Batticaloa, Hambantota): 20–40% lower

## Scaling by guest count
Catering and hall hire scale linearly. Decor and entertainment are semi-fixed. Attire and photography are fixed.

## Rules
- Use the breakdown to allocate realistically (sum of min/max should ≈ total min/max)
- Always include a contingency buffer line (10%)
- Add tradition-specific line items: Kandyan → poruwa, magul bera, ves; Hindu → mehndi, nadaswaram; Muslim → halal catering surcharge, maulvi fee
- USD conversion: use 1 USD ≈ 310 LKR (2025 approximate)
- Keep notes practical and local
