export type HindiQuote = { text: string; meaning: string }
export type EnglishQuote = { text: string; author: string }

export const HINDI_QUOTES: HindiQuote[] = [
  {
    text: "पढ़ाई कल से पक्की।",
    meaning: "Studying starts tomorrow, for sure.",
  },
  {
    text: "अटेंडेंस के लिए ही तो कॉलेज आते हैं।",
    meaning: "We come to college only for the attendance.",
  },
  {
    text: "मेस का खाना और माँ के हाथ का खाना — ज़मीन-आसमान का फर्क।",
    meaning: "Mess food vs Mom's food: worlds apart.",
  },
  {
    text: "एग्ज़ाम की रात ही पूरा सिलेबस याद आता है।",
    meaning: "The whole syllabus makes sense only the night before the exam.",
  },
  {
    text: "नींद पूरी तो लेक्चर अधूरा, लेक्चर पूरा तो नींद अधूरी।",
    meaning: "Either sleep or the lecture — never both.",
  },
  {
    text: "चाय के बिना असाइनमेंट अधूरा है।",
    meaning: "No assignment is complete without chai.",
  },
  {
    text: "वाई-फ़ाई स्लो है तो पढ़ाई भी स्लो।",
    meaning: "Slow Wi-Fi, slower studies.",
  },
  {
    text: "मेस में जो मिल जाए, वही आज की बेस्ट डिश है।",
    meaning: "Whatever the mess serves is today's special.",
  },
  { text: "बजट खत्म, महीना बाकी।", meaning: "Budget over, month still left." },
  {
    text: "रूममेट की मैगी पर सबका हक़ है।",
    meaning: "A roommate's Maggi belongs to everyone.",
  },
  {
    text: "प्रॉक्सी दोस्ती की सबसे बड़ी निशानी है।",
    meaning: "Marking proxy attendance is true friendship.",
  },
  {
    text: "सुबह की क्लास सिर्फ़ टाइम-टेबल में होती है।",
    meaning: "The 8 AM class exists only on the timetable.",
  },
  {
    text: "डेडलाइन ही असली मोटिवेशन है।",
    meaning: "Deadlines are the only real motivation.",
  },
  {
    text: "एक और एपिसोड, फिर पढ़ेंगे।",
    meaning: "One more episode, then I'll study.",
  },
  {
    text: "कैंटीन का उधार, दोस्ती का आधार।",
    meaning: "Canteen credit is the foundation of friendship.",
  },
  {
    text: "जब तक चार्जर है, तब तक ज़िंदगी है।",
    meaning: "As long as there's a charger, there's life.",
  },
  {
    text: "ग्रुप प्रोजेक्ट में एक करता है, बाकी नाम देते हैं।",
    meaning: "In group projects, one works and the rest just add their names.",
  },
  {
    text: "मेस बंद है — आज फिर मैगी।",
    meaning: "Mess is closed — Maggi again today.",
  },
  {
    text: "नोट्स उसी के अच्छे होते हैं जो क्लास नहीं आता।",
    meaning: "The best notes belong to the one who never attends.",
  },
  {
    text: "एग्ज़ाम पास, पर पूछो मत कैसे।",
    meaning: "Passed the exam — don't ask how.",
  },
  {
    text: "छुट्टी की खबर सबसे तेज़ फैलती है।",
    meaning: "News of a holiday travels the fastest.",
  },
  {
    text: "फ्री का खाना कभी मना नहीं करते।",
    meaning: "Never say no to free food.",
  },
  {
    text: "रात को पढ़ाई, दिन को नींद — हॉस्टल लाइफ।",
    meaning: "Study at night, sleep by day — hostel life.",
  },
  {
    text: "प्रैक्टिकल फ़ाइल आखिरी रात को ही पूरी होती है।",
    meaning: "The practical file gets finished only the last night.",
  },
  {
    text: "अलार्म बजता है, पर सुनता कौन है।",
    meaning: "The alarm rings; who's listening though.",
  },
  { text: "जेब खाली, सपने भारी।", meaning: "Empty pockets, heavy dreams." },
  {
    text: "टॉपर भी कहता है — कुछ नहीं पढ़ा।",
    meaning: "Even the topper says 'I didn't study'.",
  },
  {
    text: "मेस में पनीर ढूँढना खज़ाना ढूँढने जैसा है।",
    meaning: "Finding paneer in the mess is like finding treasure.",
  },
  {
    text: "जो जल्दी सो गया, वो रात का खाना खो गया।",
    meaning: "Sleep early and you miss dinner.",
  },
  {
    text: "असाइनमेंट कॉपी-पेस्ट, पर नाम अपना।",
    meaning: "Copy-paste the assignment, but keep your own name on it.",
  },
]

export const ENGLISH_FALLBACK: EnglishQuote[] = [
  { text: "I'm not lazy, I'm on energy-saving mode.", author: "Every Student" },
  { text: "Sleep is for the weak, and I am very weak.", author: "A Hosteler" },
  { text: "My study plan: panic, then results.", author: "Exam Warrior" },
  { text: "Maggi is not just food, it's an emotion.", author: "Room 204" },
  {
    text: "Attendance is the only thing I collect religiously.",
    author: "The Backbencher",
  },
  {
    text: "I came, I saw, I forgot everything in the exam.",
    author: "Anonymous Topper",
  },
  { text: "Deadlines make the best alarm clocks.", author: "Every Student" },
  { text: "The library is where I go to nap peacefully.", author: "A Scholar" },
  {
    text: "Group project: one hero, many spectators.",
    author: "The One Who Did It All",
  },
  {
    text: "One more episode never hurt anyone... except my grades.",
    author: "Netflix & Nil",
  },
  { text: "Chai first, chapters later.", author: "The Realist" },
  { text: "Broke, but make it aesthetic.", author: "Broke by the 10th" },
]

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T
}
