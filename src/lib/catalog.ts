// Shared catalogue of ragas and genres used by the navigation, search filters,
// and homepage explorer. Single source of truth so every surface stays in sync.

export interface RagaEntry {
  label: string;
  value: string;
}

export interface GenreEntry {
  label: string;
  value: string;
}

export const RAGAS: RagaEntry[] = [
  { label: 'Abhogi', value: 'abhogi' }, { label: 'Adana', value: 'adana' },
  { label: 'Ahir Bhairav', value: 'ahir-bhairav' }, { label: 'Amritvarshini', value: 'amritvarshini' },
  { label: 'Asa', value: 'asa' }, { label: 'Asavari', value: 'asavari' },
  { label: 'Bageshri', value: 'bageshri' }, { label: 'Bahar', value: 'bahar' },
  { label: 'Bairagi', value: 'bairagi' }, { label: 'Bairari', value: 'bairari' },
  { label: 'Barwa', value: 'barwa' }, { label: 'Basant', value: 'basant' },
  { label: 'Bhairav', value: 'bhairav' }, { label: 'Bhairavi', value: 'bhairavi' },
  { label: 'Sindhu Bhairavi', value: 'sindhu-bhairavi' }, { label: 'Bhatiyar', value: 'Bhatiyar' },
  { label: 'Bhimpalasi', value: 'Bhimpalasi' }, { label: 'Bhimsen', value: 'Bhimsen' },
  { label: 'Bhinna Shadja', value: 'Bhinna%20Shadja' }, { label: 'Bhoopali', value: 'Bhoopali' },
  { label: 'Bhoopeshwari', value: 'Bhoopeshwari' }, { label: 'Bibhas', value: 'Bibhas' },
  { label: 'Bihag', value: 'Bihag' }, { label: 'Hem Bihag', value: 'Hem%20Bihag' },
  { label: 'Bihagara', value: 'Bihagara' }, { label: 'Bilaval', value: 'Bilaval' },
  { label: 'Alhaiya Bilaval', value: 'Alhaiya%20Bilaval' }, { label: 'Brindavani Sarang', value: 'Brindavani%20Sarang' },
  { label: 'Chandrakauns', value: 'Chandrakauns' }, { label: 'Chhayanat', value: 'Chhayanat' },
  { label: 'Darbar', value: 'Darbar' }, { label: 'Darbari Kanada', value: 'Darbari%20Kanada' },
  { label: 'Desh', value: 'Desh' }, { label: 'Desi', value: 'Desi' },
  { label: 'Dhanashree', value: 'Dhanashree' }, { label: 'Puriya Dhanashree', value: 'Puriya%20Dhanashree' },
  { label: 'Dhani', value: 'Dhani' }, { label: 'Durga', value: 'Durga' },
  { label: 'Gond', value: 'Gond' }, { label: 'Gaud Malhar', value: 'Gaud%20Malhar' },
  { label: 'Gaud Sarang', value: 'Gaud%20Sarang' }, { label: 'Gauri', value: 'Gauri' },
  { label: 'Gorakh Kalyan', value: 'Gorakh%20Kalyan' }, { label: 'Gujjari', value: 'Gujjari' },
  { label: 'Gunakri', value: 'Gunakri' }, { label: 'Gurjari', value: 'Gurjari' },
  { label: 'Hameer', value: 'Hameer' }, { label: 'Hindol', value: 'Hindol' },
  { label: 'Jaijaivanti', value: 'Jaijaivanti' }, { label: 'Jaitsri', value: 'Jaitsri' },
  { label: 'Jaunpuri', value: 'Jaunpuri' }, { label: 'Jhinjhoti', value: 'Jhinjhoti' },
  { label: 'Jog', value: 'Jog' }, { label: 'Jogiya', value: 'Jogiya' },
  { label: 'Kafi', value: 'Kafi' }, { label: 'Kalavati', value: 'Kalavati' },
  { label: 'Kanada', value: 'Kanada' }, { label: 'Kedar', value: 'Kedar' },
  { label: 'Khamaj', value: 'Khamaj' }, { label: 'Kirwani', value: 'Kirwani' },
  { label: 'Lalit', value: 'Lalit' }, { label: 'Malhar', value: 'Malhar%20' },
  { label: 'Malkauns', value: 'Malkauns' }, { label: 'Mangala Gujjari', value: 'Mangala%20Gujjari' },
  { label: 'Multani', value: 'Multani' }, { label: 'Nat Bhairav', value: 'Nat%20Bhairav' },
  { label: 'Patdeep', value: 'Patdeep' }, { label: 'Purvi', value: 'Purvi' },
  { label: 'Ramkali', value: 'Ramkali' }, { label: 'Shivaranjani', value: 'Shivaranjani' },
  { label: 'Sohni', value: 'Sohni' }, { label: 'Bilaskhani Todi', value: 'Bilaskhani%20Todi' },
  { label: 'Yaman', value: 'Yaman' }, { label: 'Zeelaf', value: 'Zeelaf' },
];

export const GENRES: GenreEntry[] = [
  { label: 'Indian', value: 'Indian' }, { label: 'Classical', value: 'Western%20classical' },
  { label: 'Blues', value: 'blues' }, { label: 'Country', value: 'country' },
  { label: 'Disco', value: 'disco' }, { label: 'Electronic', value: 'electronic' },
  { label: 'Folk', value: 'folk' }, { label: 'Hip hop', value: 'hip-Hop' },
  { label: 'Jazz', value: 'jazz' }, { label: 'Metal', value: 'metal' },
  { label: 'Pop', value: 'pop' }, { label: 'Rap', value: 'rap' },
  { label: 'R&B, Funk & Soul', value: 'r%26b-funk-soul' }, { label: 'Religious Music', value: 'religious-music' },
  { label: 'Rock', value: 'rock' },
];

// A curated short list surfaced in the raga strip / explorer for quick access.
export const FEATURED_RAGAS = ['Bhoopali', 'Yaman', 'Bhairavi', 'Kafi', 'Bilaval', 'Desh', 'Bhimpalasi', 'Malkauns'];
