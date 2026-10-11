/**
 * Maintainable profanity and abusive language dictionary.
 * 
 * IMPORTANT DISCLAIMER:
 * Automated profanity detection is heuristic and imperfect. It is designed
 * to deter abusive and disruptive submissions during demonstrations, but is
 * not a substitute for human moderation, content policies, or full security controls.
 */

// Words that should ONLY be blocked when they appear as an individual word/token
// to prevent the Scunthorpe problem (e.g., "Cassandra", "Dickson", "Titus", "Hancock").
export const STANDALONE_BLOCKED_WORDS: readonly string[] = [
  'ass',
  'cock',
  'dick',
  'tit',
  'tits',
  'hell',
  'damn',
  'crap',
  'piss',
  'prick',
  'homo',
  'twat',
  'dink',
  'spic',
  'gook',
  'coon',
];

// Words that are blocked either as standalone tokens or within compounds
// (e.g. "fuck", "motherfucker", "fucking", "shitface")
export const SEVERE_BLOCKED_WORDS: readonly string[] = [
  'fuck',
  'fucker',
  'fucking',
  'fucked',
  'motherfuck',
  'motherfucker',
  'shit',
  'bullshit',
  'shitty',
  'shithead',
  'bitch',
  'bitches',
  'bitching',
  'cunt',
  'cunts',
  'nigger',
  'nigga',
  'faggot',
  'fag',
  'whore',
  'slut',
  'sluts',
  'pussy',
  'pussies',
  'chink',
  'kike',
  'retard',
  'retarded',
  'bastard',
  'blowjob',
  'handjob',
  'jackoff',
  'jerkoff',
  'cum',
  'cumshot',
  'anal',
  'dildo',
  'penis',
  'vagina',
  'nazi',
  'hitler',
];

// Whitelist of legitimate names and common terms that might otherwise trigger substring matches
export const LEGITIMATE_NAME_EXEMPTIONS: readonly string[] = [
  'cassandra',
  'dickson',
  'dickens',
  'titus',
  'hancock',
  'scunthorpe',
  'cockburn',
  'peacock',
  'butter',
  'pass',
  'smith',
  'shelley',
  'mitchell',
  'moriarty',
  'shitake',
  'damian',
  'penelope',
  'analise',
  'annalise',
  'analiese',
];
