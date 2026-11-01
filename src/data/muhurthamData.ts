// Tamil Nadu Auspicious Muhurtham Dates (2026 - 2027)
// Sourced according to traditional Tamil Panchangam / Subha Muhurtham days

export interface MuhurthamDay {
  date: string; // YYYY-MM-DD
  tamilMonth: string; // e.g. "Thai", "Vaikasi", "Avani", "Karthigai"
  nakshatra: string; // e.g. "Rohini", "Uthiram", "Swati", "Magam"
  thithi: string; // e.g. "Shukla Paksha Panchami", "Valarpirai"
  auspiciousTiming: string; // e.g. "06:00 AM - 07:30 AM", "09:15 AM - 10:45 AM"
  peakYieldLevel: 'Very High (Premium)' | 'High' | 'Normal';
  recommendedMinPax: number;
  notes: string;
}

export const TAMIL_NADU_MUHURTHAM_DATES: MuhurthamDay[] = [
  // 2026 Dates
  {
    date: '2026-01-22',
    tamilMonth: 'Thai (தை)',
    nakshatra: 'Uthirattathi',
    thithi: 'Shukla Chaturthi',
    auspiciousTiming: '06:00 AM - 07:30 AM',
    peakYieldLevel: 'Very High (Premium)',
    recommendedMinPax: 250,
    notes: 'Prime Thai Muhurtham date. High wedding and reception demand in Chennai.'
  },
  {
    date: '2026-01-25',
    tamilMonth: 'Thai (தை)',
    nakshatra: 'Revathi',
    thithi: 'Shukla Saptami',
    auspiciousTiming: '09:00 AM - 10:30 AM',
    peakYieldLevel: 'Very High (Premium)',
    recommendedMinPax: 300,
    notes: 'Sunday Thai Muhurtham. Extremely heavy booking rush.'
  },
  {
    date: '2026-02-08',
    tamilMonth: 'Thai (தை)',
    nakshatra: 'Swathi',
    thithi: 'Shukla Ekadashi',
    auspiciousTiming: '06:15 AM - 07:45 AM',
    peakYieldLevel: 'High',
    recommendedMinPax: 200,
    notes: 'Valarpirai auspicious day for engagements & weddings.'
  },
  {
    date: '2026-02-19',
    tamilMonth: 'Maasi (மாசி)',
    nakshatra: 'Uthiram',
    thithi: 'Shukla Tritiya',
    auspiciousTiming: '07:30 AM - 09:00 AM',
    peakYieldLevel: 'Very High (Premium)',
    recommendedMinPax: 250,
    notes: 'Maasi Valarpirai Subha Muhurtham. High hall occupancy expected.'
  },
  {
    date: '2026-02-22',
    tamilMonth: 'Maasi (மாசி)',
    nakshatra: 'Hastham',
    thithi: 'Shukla Shashti',
    auspiciousTiming: '09:00 AM - 10:30 AM',
    peakYieldLevel: 'Very High (Premium)',
    recommendedMinPax: 300,
    notes: 'Sunday Maasi Muhurtham. Ideal for Grand Ballroom composite bookings.'
  },
  {
    date: '2026-03-05',
    tamilMonth: 'Maasi (மாசி)',
    nakshatra: 'Swati',
    thithi: 'Shukla Dwadashi',
    auspiciousTiming: '06:00 AM - 07:15 AM',
    peakYieldLevel: 'High',
    recommendedMinPax: 200,
    notes: 'Auspicious morning ceremony timing.'
  },
  {
    date: '2026-04-16',
    tamilMonth: 'Chithirai (சித்திரை)',
    nakshatra: 'Ashwini',
    thithi: 'Shukla Pratipada',
    auspiciousTiming: '06:30 AM - 08:00 AM',
    peakYieldLevel: 'High',
    recommendedMinPax: 200,
    notes: 'Tamil New Year week auspicious Muhurtham.'
  },
  {
    date: '2026-05-07',
    tamilMonth: 'Chithirai (சித்திரை)',
    nakshatra: 'Uthirattathi',
    thithi: 'Shukla Panchami',
    auspiciousTiming: '07:00 AM - 08:30 AM',
    peakYieldLevel: 'High',
    recommendedMinPax: 200,
    notes: 'Favorable wedding muhurtham.'
  },
  {
    date: '2026-05-24',
    tamilMonth: 'Vaikasi (வைகாசி)',
    nakshatra: 'Magam',
    thithi: 'Shukla Ashtami',
    auspiciousTiming: '09:15 AM - 10:45 AM',
    peakYieldLevel: 'Very High (Premium)',
    recommendedMinPax: 350,
    notes: 'Vaikasi Visakam season - Peak wedding season in Tamil Nadu.'
  },
  {
    date: '2026-05-28',
    tamilMonth: 'Vaikasi (வைகாசி)',
    nakshatra: 'Hastham',
    thithi: 'Shukla Dwadashi',
    auspiciousTiming: '06:00 AM - 07:30 AM',
    peakYieldLevel: 'Very High (Premium)',
    recommendedMinPax: 300,
    notes: 'Vaikasi prime wedding date. Enforce premium minimum guarantee.'
  },
  {
    date: '2026-06-11',
    tamilMonth: 'Vaikasi (வைகாசி)',
    nakshatra: 'Swati',
    thithi: 'Krishna Dwitiya',
    auspiciousTiming: '07:00 AM - 08:30 AM',
    peakYieldLevel: 'High',
    recommendedMinPax: 200,
    notes: 'End of Vaikasi wedding window.'
  },
  {
    date: '2026-07-02',
    tamilMonth: 'Aani (ஆனி)',
    nakshatra: 'Uthirattathi',
    thithi: 'Shukla Tritiya',
    auspiciousTiming: '06:15 AM - 07:45 AM',
    peakYieldLevel: 'Normal',
    recommendedMinPax: 150,
    notes: 'Aani Subha Muhurtham.'
  },
  {
    date: '2026-08-27',
    tamilMonth: 'Avani (ஆவணி)',
    nakshatra: 'Rohini',
    thithi: 'Shukla Chaturthi',
    auspiciousTiming: '06:00 AM - 07:30 AM',
    peakYieldLevel: 'Very High (Premium)',
    recommendedMinPax: 350,
    notes: 'Avani Muhurtham - Major wedding season kickoff in Tamil Nadu.'
  },
  {
    date: '2026-08-30',
    tamilMonth: 'Avani (ஆவணி)',
    nakshatra: 'Thiruvonam',
    thithi: 'Shukla Saptami',
    auspiciousTiming: '09:00 AM - 10:30 AM',
    peakYieldLevel: 'Very High (Premium)',
    recommendedMinPax: 400,
    notes: 'Avani Sunday Muhurtham. Highest yield potential of the quarter.'
  },
  {
    date: '2026-09-06',
    tamilMonth: 'Avani (ஆவணி)',
    nakshatra: 'Uthirattathi',
    thithi: 'Shukla Dashami',
    auspiciousTiming: '07:15 AM - 08:45 AM',
    peakYieldLevel: 'High',
    recommendedMinPax: 250,
    notes: 'Avani Valarpirai wedding day.'
  },
  {
    date: '2026-10-25',
    tamilMonth: 'Aippasi (ஐப்பசி)',
    nakshatra: 'Revathi',
    thithi: 'Shukla Panchami',
    auspiciousTiming: '07:00 AM - 08:30 AM',
    peakYieldLevel: 'High',
    recommendedMinPax: 200,
    notes: 'Aippasi festive auspicious ceremony date.'
  },
  {
    date: '2026-11-19',
    tamilMonth: 'Karthigai (கார்த்திகை)',
    nakshatra: 'Uthiram',
    thithi: 'Shukla Dashami',
    auspiciousTiming: '06:00 AM - 07:30 AM',
    peakYieldLevel: 'Very High (Premium)',
    recommendedMinPax: 300,
    notes: 'Karthigai Valarpirai Subha Muhurtham. Peak winter wedding demand.'
  },
  {
    date: '2026-11-22',
    tamilMonth: 'Karthigai (கார்த்திகை)',
    nakshatra: 'Hastham',
    thithi: 'Shukla Trayodashi',
    auspiciousTiming: '09:15 AM - 10:45 AM',
    peakYieldLevel: 'Very High (Premium)',
    recommendedMinPax: 350,
    notes: 'Sunday Karthigai Muhurtham. Expect multiple conflicting enquiries.'
  },
  {
    date: '2026-12-03',
    tamilMonth: 'Karthigai (கார்த்திகை)',
    nakshatra: 'Uthirattathi',
    thithi: 'Krishna Navami',
    auspiciousTiming: '06:30 AM - 08:00 AM',
    peakYieldLevel: 'High',
    recommendedMinPax: 200,
    notes: 'Final auspicious date before Margazhi month.'
  },

  // 2027 Dates
  {
    date: '2027-01-24',
    tamilMonth: 'Thai (தை)',
    nakshatra: 'Magam',
    thithi: 'Shukla Saptami',
    auspiciousTiming: '06:15 AM - 07:45 AM',
    peakYieldLevel: 'Very High (Premium)',
    recommendedMinPax: 300,
    notes: 'Thai 2027 opening Subha Muhurtham.'
  },
  {
    date: '2027-02-14',
    tamilMonth: 'Maasi (மாசி)',
    nakshatra: 'Rohini',
    thithi: 'Shukla Ashtami',
    auspiciousTiming: '09:00 AM - 10:30 AM',
    peakYieldLevel: 'Very High (Premium)',
    recommendedMinPax: 350,
    notes: 'Sunday Maasi Muhurtham 2027.'
  },
  {
    date: '2027-05-23',
    tamilMonth: 'Vaikasi (வைகாசி)',
    nakshatra: 'Uthiram',
    thithi: 'Shukla Dashami',
    auspiciousTiming: '06:30 AM - 08:00 AM',
    peakYieldLevel: 'Very High (Premium)',
    recommendedMinPax: 400,
    notes: 'Vaikasi 2027 peak wedding date.'
  }
];

// Helper to check if a specific date (YYYY-MM-DD) is an auspicious Muhurtham day
export function getMuhurthamInfo(dateStr: string): MuhurthamDay | undefined {
  if (!dateStr) return undefined;
  return TAMIL_NADU_MUHURTHAM_DATES.find(m => m.date === dateStr);
}

export function isMuhurthamDate(dateStr: string): boolean {
  return Boolean(getMuhurthamInfo(dateStr));
}
