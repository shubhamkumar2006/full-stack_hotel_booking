const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const propertiesToSeed = [
  // ── Mumbai ──
  {
    name: 'Mumbai Backpacker Shelter',
    description: 'Cozy and extremely affordable backpacker hostel located near Bandra. Perfect for solo travellers and students exploring Mumbai on a budget.',
    address: '15 Carter Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    propertyType: 'hostel',
    priceRange: 'BUDGET',
    geoLat: 19.0596,
    geoLng: 72.8295,
    thumbnailImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    amenities: ['WiFi', 'AC', 'Locker', 'Common Kitchen']
  },
  {
    name: 'Gateway Residency',
    description: 'Comfortable business hotel near Colaba Causeway. Offers clean rooms, desk spaces, and easy access to South Mumbai business districts.',
    address: '88 Shivaji Marg, Colaba',
    city: 'Mumbai',
    state: 'Maharashtra',
    propertyType: 'hotel',
    priceRange: 'MIDRANGE',
    geoLat: 18.9067,
    geoLng: 72.8147,
    thumbnailImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    amenities: ['WiFi', 'AC', 'Breakfast', 'Gym', 'Parking']
  },
  {
    name: 'The Grand Palace Hotel',
    description: 'Experience luxury at its finest with stunning views of the Arabian Sea, world-class dining, and impeccable royal hospitality.',
    address: '123 Marine Drive',
    city: 'Mumbai',
    state: 'Maharashtra',
    propertyType: 'hotel',
    priceRange: 'LUXURY',
    geoLat: 18.9438,
    geoLng: 72.8232,
    thumbnailImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Room Service']
  },

  // ── Delhi ──
  {
    name: 'Pahar Ganj Tourist Lodge',
    description: 'Budget-friendly lodging situated right in the heart of Delhi, close to the New Delhi Railway Station and bustling local markets.',
    address: '42 Main Bazaar, Pahar Ganj',
    city: 'Delhi',
    state: 'Delhi',
    propertyType: 'inn',
    priceRange: 'BUDGET',
    thumbnailImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    amenities: ['WiFi', 'AC', 'Room Service']
  },
  {
    name: 'Delhi Connaught Hub',
    description: 'Modern, mid-range boutique stay located right off Connaught Place. Ideal for travelers who want to be close to the central business and shopping hub.',
    address: '12 Regal Building, Connaught Place',
    city: 'Delhi',
    state: 'Delhi',
    propertyType: 'boutique',
    priceRange: 'MIDRANGE',
    thumbnailImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    amenities: ['WiFi', 'AC', 'Breakfast', 'Restaurant', 'Conference Room']
  },
  {
    name: 'Delhi Heritage Haveli',
    description: 'Stay in a beautifully restored 200-year-old heritage haveli in Old Delhi. Experience traditional Mughal architecture and authentic Mughlai cuisine.',
    address: '7 Chandni Chowk Lane',
    city: 'Delhi',
    state: 'Delhi',
    propertyType: 'boutique',
    priceRange: 'LUXURY',
    thumbnailImage: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
    amenities: ['WiFi', 'Traditional Courtyard', 'Restaurant', 'Cultural Tours', 'Heritage Library']
  },

  // ── Goa ──
  {
    name: 'Anjuna Beach Hostel',
    description: 'Vibrant, budget-friendly beach hostel with a lively social vibe, outdoor cafe, and weekly karaoke nights. Steps away from the sand.',
    address: '102 Anjuna Beach Road',
    city: 'Goa',
    state: 'Goa',
    propertyType: 'hostel',
    priceRange: 'BUDGET',
    thumbnailImage: 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=800&q=80',
    amenities: ['WiFi', 'AC', 'Beach Access', 'Bar', 'Bicycle Rental']
  },
  {
    name: 'Panaji Riverside Inn',
    description: 'Charming boutique inn located along the Mandovi River. Relax in a peaceful environment while being minutes away from Goan historic sites.',
    address: '22 Riverview Walk, Panaji',
    city: 'Goa',
    state: 'Goa',
    propertyType: 'inn',
    priceRange: 'MIDRANGE',
    thumbnailImage: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80',
    amenities: ['WiFi', 'AC', 'Pool', 'Restaurant', 'Parking']
  },
  {
    name: 'Goa Beach Resort',
    description: 'Villas and suites directly on Calangute beach. Features infinity pools, luxury spa treatments, and water sports at your doorstep.',
    address: '45 Calangute Beach Road',
    city: 'Goa',
    state: 'Goa',
    propertyType: 'resort',
    priceRange: 'LUXURY',
    thumbnailImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
    amenities: ['WiFi', 'Beach Access', 'Pool', 'Water Sports', 'Restaurant', 'Bar', 'Spa', 'Gym']
  },

  // ── Jaipur ──
  {
    name: 'Hawa Mahal Guest House',
    description: 'Traditional guest house offering pocket-friendly rooms decorated with local Rajasthani block prints, near major tourist attractions.',
    address: '5 Hawa Mahal Marg',
    city: 'Jaipur',
    state: 'Rajasthan',
    propertyType: 'inn',
    priceRange: 'BUDGET',
    thumbnailImage: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&q=80',
    amenities: ['WiFi', 'AC', 'Rooftop Lounge']
  },
  {
    name: 'Jaipur Pink City Inn',
    description: 'A charming boutique hotel near Johari Bazaar. Our rooftop dining offers beautiful panoramic views of the historic Pink City.',
    address: '22 Johari Bazaar',
    city: 'Jaipur',
    state: 'Rajasthan',
    propertyType: 'inn',
    priceRange: 'MIDRANGE',
    thumbnailImage: 'https://images.unsplash.com/photo-1553697388-94e804e2f0f6?w=800&q=80',
    amenities: ['WiFi', 'Rooftop Restaurant', 'Heritage Walks', 'Cultural Shows', 'Travel Desk']
  },
  {
    name: 'Rajputana Palace Resort',
    description: 'Ultra-luxury heritage resort featuring sprawling lawns, grand Durbar hall architecture, Royal polo stables, and fine dining.',
    address: '1 Palace Drive, Amer',
    city: 'Jaipur',
    state: 'Rajasthan',
    propertyType: 'resort',
    priceRange: 'LUXURY',
    thumbnailImage: 'https://images.unsplash.com/photo-1540541338537-0da3cb6b1413?w=800&q=80',
    amenities: ['WiFi', 'Pool', 'Spa', 'Royal Dinings', 'Boutiques', 'Gardens']
  },

  // ── Kerala ──
  {
    name: 'Kerala Backwaters Homestay',
    description: 'Experience authentic Kerala hospitality at this riverside homestay. Features freshly prepared traditional home-cooked meals.',
    address: '15 Alleppey Canal Bank',
    city: 'Kerala',
    state: 'Kerala',
    propertyType: 'homestay',
    priceRange: 'BUDGET',
    thumbnailImage: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80',
    amenities: ['WiFi', 'Home Food', 'Boat Tours', 'Bicycles']
  },
  {
    name: 'Munnar Tea Estate Retreat',
    description: 'Nestled amid lush tea plantations in Munnar. Our eco-retreat offers nature trails, plantation tours, and organic dining.',
    address: 'Tea Estate Road, Munnar',
    city: 'Kerala',
    state: 'Kerala',
    propertyType: 'resort',
    priceRange: 'MIDRANGE',
    thumbnailImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    amenities: ['WiFi', 'Tea Plantation Tours', 'Ayurvedic Spa', 'Organic Restaurant', 'Nature Trails']
  },
  {
    name: 'Kumarakom Lake Luxury Resort',
    description: 'Elite luxury villa resort overlooking the pristine Vembanad Lake. Experience heritage villas with private plunge pools and traditional houseboats.',
    address: '10 Lakeview Road, Kumarakom',
    city: 'Kerala',
    state: 'Kerala',
    propertyType: 'resort',
    priceRange: 'LUXURY',
    thumbnailImage: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
    amenities: ['WiFi', 'Infinity Pool', 'Ayurvedic Spa', 'Lakefront Dining', 'Houseboat Cruises', 'Gym']
  },

  // ── Bangalore ──
  {
    name: 'Indiranagar Co-Living Hub',
    description: 'Trendy, budget co-living space located in Indiranagar. Ideal for tech professionals, digital nomads, and young travelers.',
    address: '142 double road, Indiranagar',
    city: 'Bangalore',
    state: 'Karnataka',
    propertyType: 'hostel',
    priceRange: 'BUDGET',
    thumbnailImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    amenities: ['WiFi', 'Co-working Space', 'AC', 'Lounge', 'Gym']
  },
  {
    name: 'Silicon Valley Business Hotel',
    description: 'Modern hotel located near Outer Ring Road. Offering comfortable work desks, high-speed fiber internet, and meeting facilities.',
    address: '88 Tech Park Boulevard',
    city: 'Bangalore',
    state: 'Karnataka',
    propertyType: 'hotel',
    priceRange: 'MIDRANGE',
    thumbnailImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    amenities: ['WiFi', 'AC', 'Breakfast Buffet', 'Gym', 'Conference Rooms']
  },
  {
    name: 'The UB City Garden Pavilion',
    description: 'Ultra-luxurious rooms and suites overlooking Cubbon Park. High-end dining, luxury wellness spa, and sky-deck infinity pool.',
    address: 'Vittal Mallya Road',
    city: 'Bangalore',
    state: 'Karnataka',
    propertyType: 'hotel',
    priceRange: 'LUXURY',
    thumbnailImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    amenities: ['WiFi', 'Rooftop Pool', 'Luxury Spa', 'Fine Dining', 'Helipad Access', 'Valet Parking']
  },

  // ── Hyderabad ──
  {
    name: 'Charminar Heritage Stay',
    description: 'Affordable, cultural lodging close to the historic Charminar mosque. Offers easy access to the famous pearl bazaars.',
    address: '5 Laad Bazaar',
    city: 'Hyderabad',
    state: 'Telangana',
    propertyType: 'inn',
    priceRange: 'BUDGET',
    thumbnailImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    amenities: ['WiFi', 'AC', 'Traditional Chai']
  },
  {
    name: 'Hitech City Suite',
    description: 'Mid-range service apartments in Hyderabad\'s tech corridor. Perfect for business travelers and long-term relocations.',
    address: '23 Cyber Towers Lane',
    city: 'Hyderabad',
    state: 'Telangana',
    propertyType: 'hotel',
    priceRange: 'MIDRANGE',
    thumbnailImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    amenities: ['WiFi', 'AC', 'Kitchenette', 'Laundry', 'Gym']
  },
  {
    name: 'Taj Falaknuma Vista',
    description: 'Relive the Nizam grandeur at this luxury heritage palace. Experience royal carriage entries, vintage tea lounges, and gourmet dining.',
    address: 'Engine Bowli, Falaknuma',
    city: 'Hyderabad',
    state: 'Telangana',
    propertyType: 'hotel',
    priceRange: 'LUXURY',
    thumbnailImage: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
    amenities: ['WiFi', 'Palace Garden', 'Royal Spa', 'Fine Dining', 'Pool', 'Butler Service']
  },

  // ── Udaipur ──
  {
    name: 'Lake Pichola Budget Inn',
    description: 'Highly affordable lakeside lodging with stunning terrace views of Lake Pichola and the City Palace at budget rates.',
    address: '12 Lal Ghat',
    city: 'Udaipur',
    state: 'Rajasthan',
    propertyType: 'inn',
    priceRange: 'BUDGET',
    thumbnailImage: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&q=80',
    amenities: ['WiFi', 'Lake View Terrace', 'Rooftop Cafe']
  },
  {
    name: 'Mewar Castle Boutique Stay',
    description: 'Beautifully decorated boutique hotel in the old city. Features antique furnishings and traditional Mewar paintings.',
    address: '4 Gangaur Ghat',
    city: 'Udaipur',
    state: 'Rajasthan',
    propertyType: 'boutique',
    priceRange: 'MIDRANGE',
    thumbnailImage: 'https://images.unsplash.com/photo-1553697388-94e804e2f0f6?w=800&q=80',
    amenities: ['WiFi', 'AC', 'Restaurant', 'Sightseeing Desk']
  },
  {
    name: 'The Lake Palace View',
    description: 'Spectacular luxury hotel floating on Lake Pichola. Sprawling marble corridors, lake-facing luxury suites, and royal spa boat.',
    address: 'Lake Pichola',
    city: 'Udaipur',
    state: 'Rajasthan',
    propertyType: 'hotel',
    priceRange: 'LUXURY',
    thumbnailImage: 'https://images.unsplash.com/photo-1540541338537-0da3cb6b1413?w=800&q=80',
    amenities: ['WiFi', 'Floating Pool', 'Luxury Spa', 'Lakefront Dining', 'Royal Cruises']
  }
];

const imagePool = {
  hostel: [
    'https://images.unsplash.com/photo-155854877-bab0e564b8d5?w=800&q=80',
    'https://images.unsplash.com/photo-1596251300299-c3909079e974?w=800&q=80',
    'https://images.unsplash.com/photo-1623731244936-e4b17ee2d770?w=800&q=80',
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80'
  ],
  inn: [
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80',
    'https://images.unsplash.com/photo-1606046604972-77cc76aee944?w=800&q=80',
    'https://images.unsplash.com/photo-1504624720567-64a41aa25d70?w=800&q=80'
  ],
  homestay: [
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80',
    'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80'
  ],
  hotel: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'
  ],
  resort: [
    'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=800&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
    'https://images.unsplash.com/photo-1540541338537-0da3cb6b1413?w=800&q=80'
  ],
  boutique: [
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
    'https://images.unsplash.com/photo-1553697388-94e804e2f0f6?w=800&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80'
  ],
  villa: [
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'
  ]
};

const propertyTemplates = {
  BUDGET: {
    types: {
      hostel: {
        names: ['Backpacker Haven', 'Social Nest', 'Youth Hub', 'Wanderlust Base', 'Nomad Corner'],
        descriptions: ['A lively social hostel perfect for solo travelers and backpackers. Features cozy bunks, vibrant common areas, and regular social events.', 'Affordable co-living space with high-speed internet and fully equipped communal kitchen. Perfect for digital nomads.'],
        amenities: ['WiFi', 'AC', 'Locker', 'Common Kitchen', 'Laundry']
      },
      inn: {
        names: ['Lakeside Rest', 'Traveler Lodge', 'Cozy Corner Inn', 'Highway Stop', 'Heritage Restway'],
        descriptions: ['Comfortable, no-frills lodging offering clean beds, hot water, and a quiet night\'s sleep at unbeatable rates.', 'A simple, budget-friendly inn located close to local transportation links and transit routes.'],
        amenities: ['WiFi', 'AC', 'Room Service', 'Parking']
      },
      homestay: {
        names: ['Heritage Homestay', 'Village Cottage', 'Family Nest', 'Green View Stay', 'Local Vibe Cabin'],
        descriptions: ['Experience genuine local hospitality. Stay with a local family, enjoy home-cooked meals, and learn about the local culture.', 'Quiet room in a cozy family home. Enjoy beautiful garden spaces and traditional home-made breakfasts.'],
        amenities: ['WiFi', 'Home Food', 'Garden', 'AC']
      },
      hotel: {
        names: ['Budget Comfort', 'City Stay Hotel', 'Transit Plaza', 'Express Inn', 'Central Lodge'],
        descriptions: ['Clean and basic hotel rooms catering to business travelers and tourists on a budget. Comfortable beds and essential amenities.', 'Standard budget hotel providing hassle-free stays, friendly 24/7 service, and standard amenities.'],
        amenities: ['WiFi', 'AC', 'Parking', 'Room Service']
      }
    }
  },
  MIDRANGE: {
    types: {
      hotel: {
        names: ['Executive Suites', 'Urban Plaza', 'Parkview Residency', 'Metropolitan Hotel', 'Gateway Suites'],
        descriptions: ['Modern mid-range hotel featuring spacious workspaces, complimentary high-speed internet, and breakfast buffet. Ideal for business and leisure.', 'Comfortable hotel in a premium commercial district. Offers well-appointed rooms, fitness center, and multi-cuisine restaurant.'],
        amenities: ['WiFi', 'AC', 'Breakfast', 'Gym', 'Parking', 'Restaurant', 'Room Service']
      },
      resort: {
        names: ['Lush Valley Resort', 'Plumeria Eco Retreat', 'Pine Wood Escape', 'Hills and Valleys', 'Riverfront Retreat'],
        descriptions: ['Eco-friendly resort nestled in nature. Features nature trails, outdoor activities, organic dining, and relaxing spa sessions.', 'Charming getaway resort featuring beautiful landscaping, swimming pool, indoor games, and multi-cuisine restaurant.'],
        amenities: ['WiFi', 'AC', 'Pool', 'Restaurant', 'Gym', 'Parking']
      },
      boutique: {
        names: ['Artisan boutique stay', 'Vintage Charm', 'Lanterne Boutique', 'Orchard Manor', 'Urban Oasis'],
        descriptions: ['Stylishly decorated boutique stay reflecting local culture and craftsmanship. Enjoy curated aesthetic details and personal care.', 'An elegant boutique property with a unique theme, customizable services, and a quiet, peaceful atmosphere.'],
        amenities: ['WiFi', 'AC', 'Breakfast', 'Restaurant', 'Room Service']
      },
      villa: {
        names: ['Sun Kissed Villa', 'Palm Grove Bungalow', 'Orchard Retreat', 'Serene Greens', 'The Hideout'],
        descriptions: ['A cozy private villa with spacious bedrooms, living room, and a small private patio. Ideal for families and small groups.', 'Beautiful family villa surrounded by nature. Perfect weekend getaway with absolute privacy and comfort.'],
        amenities: ['WiFi', 'Kitchen', 'AC', 'Garden', 'Parking', 'Laundry']
      }
    }
  },
  LUXURY: {
    types: {
      hotel: {
        names: ['The Grand Regency', 'Royal Sovereign', 'Astoria Palace', 'The Monarch Mansion', 'Imperial Grand'],
        descriptions: ['Experience ultimate luxury with state-of-the-art wellness centers, fine-dining restaurants, and panoramic city/sea views.', 'Ultra-luxury high-rise hotel featuring presidential suites, personal concierge service, elite sky bar, and infinity pool.'],
        amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Room Service', 'Concierge', 'Valet Parking']
      },
      resort: {
        names: ['Grand Palms Beach Resort', 'Whispering Pines Resort', 'The Oasis Sanctuary', 'Summit Royal Resort', 'Sapphire Bay Lagoon'],
        descriptions: ['Exclusive beach/hill resort offering private luxury villas, world-class ayurvedic spa, private beach access, and yacht tours.', 'Pristine luxury resort surrounded by scenic landscapes, boasting infinity pools, multiple dining pavilions, and bespoke wellness packages.'],
        amenities: ['WiFi', 'Beach Access', 'Pool', 'Water Sports', 'Restaurant', 'Bar', 'Spa', 'Gym', 'Concierge']
      },
      villa: {
        names: ['The Infinity Villa', 'Ocean Whisper Sanctuary', 'Royal Courtyard Estate', 'Skyline Horizon Villa', 'The Sanctuary'],
        descriptions: ['Exquisite luxury villa featuring a private heated infinity pool, full-time chef service, and breathtaking scenic views.', 'A sprawling estate offering premium privacy, lavish interior designs, modern entertainment systems, and private butler service.'],
        amenities: ['WiFi', 'Pool', 'Kitchen', 'AC', 'Spa', 'Gym', 'Gardens', 'Chef Service', 'Butler Service']
      },
      boutique: {
        names: ['The Heritage Palace', 'Monarque Boutique', 'The Opal Suites', 'Grandeur Heritage Mansion', 'The Prestige Club'],
        descriptions: ['A beautifully restored royal heritage property featuring vintage chandeliers, custom royal experiences, and fine dining.', 'Exemplary boutique luxury stay offering uniquely designed suites, collection of art, private dining, and bespoke local guides.'],
        amenities: ['WiFi', 'AC', 'Traditional Courtyard', 'Restaurant', 'Fine Dining', 'Cultural Tours', 'Spa', 'Bar']
      }
    }
  }
};

const generatedProperties = [];

const citiesConfig = [
  // ── Indian State Capitals ───────────────────────────────
  { city: 'Amaravati', state: 'Andhra Pradesh', areas: ['Benz Circle', 'Vijayawada Central', 'Mangalagiri', 'Riverfront'] },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', areas: ['RK Beach', 'Rushikonda', 'Jagadamba Junction', 'Waltair Uplands'] },
  { city: 'Itanagar', state: 'Arunachal Pradesh', areas: ['Ganga Market', 'Nirjuli', 'Gohpur', 'Bank Tinali'] },
  { city: 'Dispur', state: 'Assam', areas: ['GS Road', 'Ganeshguri', 'Guwahati Central', 'Paltan Bazaar'] },
  { city: 'Patna', state: 'Bihar', areas: ['Fraser Road', 'Boring Road', 'Kankerbagh', 'Exhibition Road'] },
  { city: 'Raipur', state: 'Chhattisgarh', areas: ['VIP Road', 'Jail Road', 'Telibandha', 'Pandri'] },
  { city: 'Panaji', state: 'Goa', areas: ['Fontainhas', 'Mandovi Riverfront', 'Miramar Beach', 'Campal'] },
  { city: 'Gandhinagar', state: 'Gujarat', areas: ['Infocity', 'Sector 11', 'Gift City', 'Kudasan'] },
  { city: 'Chandigarh', state: 'Chandigarh', areas: ['Sector 17', 'Sector 35', 'Elante Complex', 'Sector 22'] },
  { city: 'Shimla', state: 'Himachal Pradesh', areas: ['Mall Road', 'Ridge View', 'Chotta Shimla', 'Sanjauli'] },
  { city: 'Ranchi', state: 'Jharkhand', areas: ['Main Road', 'Lalpur', 'Doranda', 'Kanke Road'] },
  { city: 'Bangalore', state: 'Karnataka', areas: ['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout', 'MG Road'] },
  { city: 'Thiruvananthapuram', state: 'Kerala', areas: ['Kovalam', 'MG Road', 'Technopark', 'Kazhakkoottam'] },
  { city: 'Bhopal', state: 'Madhya Pradesh', areas: ['MP Nagar', 'Arera Colony', 'Upper Lake View', 'Shamla Hills'] },
  { city: 'Mumbai', state: 'Maharashtra', areas: ['Bandra West', 'Colaba', 'Juhu', 'Andheri East', 'Powai', 'Worli'] },
  { city: 'Imphal', state: 'Manipur', areas: ['Kangla', 'Thangal Bazaar', 'Paona Bazaar', 'Mantripukhri'] },
  { city: 'Shillong', state: 'Meghalaya', areas: ['Police Bazaar', 'Laitumkhrah', 'Upper Shillong', 'Polo Ground'] },
  { city: 'Aizawl', state: 'Mizoram', areas: ['Zarkawt', 'Chanmari', 'Bawngkawn', 'Khatla'] },
  { city: 'Kohima', state: 'Nagaland', areas: ['PR Hill', 'Razhu Point', 'High School Junction', 'Keziekee'] },
  { city: 'Bhubaneswar', state: 'Odisha', areas: ['Janpath', 'Saheed Nagar', 'Khandagiri', 'Patia'] },
  { city: 'Jaipur', state: 'Rajasthan', areas: ['Amer Road', 'Mansarovar', 'C-Scheme', 'Vaishali Nagar', 'Bani Park'] },
  { city: 'Gangtok', state: 'Sikkim', areas: ['MG Marg', 'Tadong', 'Deorali', 'Development Area'] },
  { city: 'Chennai', state: 'Tamil Nadu', areas: ['T. Nagar', 'Anna Salai', 'Marina Beach', 'Nungambakkam'] },
  { city: 'Hyderabad', state: 'Telangana', areas: ['Gachibowli', 'Jubilee Hills', 'Banjara Hills', 'Madhapur', 'Hitech City'] },
  { city: 'Agartala', state: 'Tripura', areas: ['Ujjayanta Palace Marg', 'Akhaura Road', 'Banamalipur', 'Gorhabasti'] },
  { city: 'Lucknow', state: 'Uttar Pradesh', areas: ['Hazratganj', 'Gomti Nagar', 'Aliganj', 'Charbagh'] },
  { city: 'Dehradun', state: 'Uttarakhand', areas: ['Rajpur Road', 'Clock Tower', 'Clement Town', 'Vasant Vihar'] },
  { city: 'Kolkata', state: 'West Bengal', areas: ['Park Street', 'Salt Lake', 'New Town', 'Ballygunge'] },

  // ── Union Territory Capitals ──────────────────────────────
  { city: 'Delhi', state: 'Delhi', areas: ['Connaught Place', 'Karol Bagh', 'Saket', 'Chanakyapuri', 'Aerocity'] },
  { city: 'Srinagar', state: 'Jammu & Kashmir', areas: ['Dal Lake Boulevard', 'Lal Chowk', 'Rajbagh', 'Nishat'] },
  { city: 'Leh', state: 'Ladakh', areas: ['Main Bazaar', 'Changspa', 'Fort Road', 'Zangsti'] },
  { city: 'Port Blair', state: 'Andaman & Nicobar', areas: ['Aberdeen Bazaar', 'Marine Hill', 'Phoenix Bay', 'Corbyn Cove'] },
  { city: 'Puducherry', state: 'Puducherry', areas: ['White Town', 'Heritage Town', 'Promenade Beach', 'Auroville Road'] },

  // ── Famous Tourist & Heritage Hubs ───────────────────────
  { city: 'Agra', state: 'Uttar Pradesh', areas: ['Fatehabad Road', 'Taj Ganj', 'Taj East Gate', 'Sadar Bazaar'] },
  { city: 'Varanasi', state: 'Uttar Pradesh', areas: ['Assi Ghat', 'Dashashwamedh Ghat', 'Godowlia', 'Cantonment'] },
  { city: 'Manali', state: 'Himachal Pradesh', areas: ['Mall Road', 'Old Manali', 'Solang Valley', 'Vashisht'] },
  { city: 'Rishikesh', state: 'Uttarakhand', areas: ['Laxman Jhula', 'Ram Jhula', 'Tapovan', 'Triveni Ghat'] },
  { city: 'Mussoorie', state: 'Uttarakhand', areas: ['Mall Road', 'Library Bazaar', 'Landour', 'Kempty'] },
  { city: 'Darjeeling', state: 'West Bengal', areas: ['Mall Road', 'Chowrasta', 'Happy Valley', 'Ghum'] },
  { city: 'Ooty', state: 'Tamil Nadu', areas: ['Charring Cross', 'Ooty Lake Road', 'Lovedale', 'Coonoor'] },
  { city: 'Kodaikanal', state: 'Tamil Nadu', areas: ['Lake Road', 'Coakers Walk', 'Naidupuram'] },
  { city: 'Coorg', state: 'Karnataka', areas: ['Madikeri', 'Kushalnagar', 'Raja Seat', 'Bhagamandala'] },
  { city: 'Chikmagalur', state: 'Karnataka', areas: ['Coffee Board Road', 'Mullayanagiri', 'MG Road'] },
  { city: 'Alleppey', state: 'Kerala', areas: ['Punnamada Backwaters', 'Beach Road', 'Finishing Point'] },
  { city: 'Munnar', state: 'Kerala', areas: ['Tea Estate Road', 'Old Munnar', 'Mattupetty'] },
  { city: 'Wayanad', state: 'Kerala', areas: ['Kalpetta', 'Vythiri', 'Sulthan Bathery'] },
  { city: 'Jaisalmer', state: 'Rajasthan', areas: ['Fort Road', 'Sam Sand Dunes', 'Hanuman Circle'] },
  { city: 'Jodhpur', state: 'Rajasthan', areas: ['Fort Road', 'Clock Tower Bazaar', 'Ratanada'] },
  { city: 'Pushkar', state: 'Rajasthan', areas: ['Main Market', 'Brahma Temple Road', 'Lake Ghat'] },
  { city: 'Mount Abu', state: 'Rajasthan', areas: ['Nakki Lake Road', 'Sunset Point', 'Dilwara'] },
  { city: 'Khajuraho', state: 'Madhya Pradesh', areas: ['Temple Road', 'Sevagram', 'Airport Road'] },
  { city: 'Amritsar', state: 'Punjab', areas: ['Golden Temple Marg', 'Ranjit Avenue', 'Lawrence Road'] },
  { city: 'Shirdi', state: 'Maharashtra', areas: ['Sai Baba Temple Marg', 'Pimpalwadi Road', 'Nagar Road'] },
  { city: 'Mahabaleshwar', state: 'Maharashtra', areas: ['Panchgani Road', 'Venna Lake', 'Market Yard'] },
  { city: 'Lonavala', state: 'Maharashtra', areas: ['Khandala Point', 'Tungarli', 'Ryewood'] },
  { city: 'Hampi', state: 'Karnataka', areas: ['Bazaar Street', 'Virupaksha Temple Road', 'Hippie Island'] },
  { city: 'Gokarna', state: 'Karnataka', areas: ['Om Beach', 'Kudle Beach', 'Main Town'] },
  { city: 'Puri', state: 'Odisha', areas: ['Grand Road', 'Swargadwar', 'VIP Road'] },
  { city: 'Kanyakumari', state: 'Tamil Nadu', areas: ['Beach Road', 'Sunset Point', 'Temple Marg'] },
  { city: 'Madurai', state: 'Tamil Nadu', areas: ['Meenakshi Temple Street', 'Town Hall Road', 'KK Nagar'] },
  { city: 'Gulmarg', state: 'Jammu & Kashmir', areas: ['Gondola Base', 'Outer Circular Road', 'Tangmarg'] },
  { city: 'Pahalgam', state: 'Jammu & Kashmir', areas: ['Betaab Valley Road', 'Aru Valley Road', 'Main Market'] },
  { city: 'Dharamshala', state: 'Himachal Pradesh', areas: ['McLeod Ganj', 'Bhagsu Nag', 'Dharamkot'] },
  { city: 'Kasauli', state: 'Himachal Pradesh', areas: ['Heritage Mall', 'Lower Mall', 'Garkhal'] }
];

const CITY_BASE_COORDINATES = {
  'Amaravati': { lat: 16.5131, lng: 80.5165 },
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185 },
  'Itanagar': { lat: 27.0844, lng: 93.6053 },
  'Dispur': { lat: 26.1445, lng: 91.7362 },
  'Patna': { lat: 25.5941, lng: 85.1376 },
  'Raipur': { lat: 21.2514, lng: 81.6296 },
  'Panaji': { lat: 15.4909, lng: 73.8278 },
  'Gandhinagar': { lat: 23.2156, lng: 72.6369 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794 },
  'Shimla': { lat: 31.1048, lng: 77.1734 },
  'Ranchi': { lat: 23.3441, lng: 85.3096 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
  'Bhopal': { lat: 23.2599, lng: 77.4126 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Imphal': { lat: 24.8170, lng: 93.9368 },
  'Shillong': { lat: 25.5788, lng: 91.8933 },
  'Aizawl': { lat: 23.7307, lng: 92.7173 },
  'Kohima': { lat: 25.6751, lng: 94.1086 },
  'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Gangtok': { lat: 27.3389, lng: 88.6065 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Agartala': { lat: 23.8315, lng: 91.2868 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Dehradun': { lat: 30.3165, lng: 78.0322 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'Srinagar': { lat: 34.0837, lng: 74.7973 },
  'Leh': { lat: 34.1526, lng: 77.5771 },
  'Port Blair': { lat: 11.6234, lng: 92.7265 },
  'Puducherry': { lat: 11.9416, lng: 79.8083 },
  'Agra': { lat: 27.1767, lng: 78.0081 },
  'Varanasi': { lat: 25.3176, lng: 82.9739 },
  'Manali': { lat: 32.2432, lng: 77.1892 },
  'Rishikesh': { lat: 30.0869, lng: 78.2676 },
  'Mussoorie': { lat: 30.4598, lng: 78.0644 },
  'Darjeeling': { lat: 27.0410, lng: 88.2663 },
  'Ooty': { lat: 11.4102, lng: 76.6950 },
  'Kodaikanal': { lat: 10.2381, lng: 77.4892 },
  'Coorg': { lat: 12.4244, lng: 75.7382 },
  'Chikmagalur': { lat: 13.3161, lng: 75.7720 },
  'Alleppey': { lat: 9.4981, lng: 76.3388 },
  'Munnar': { lat: 10.0889, lng: 77.0595 },
  'Wayanad': { lat: 11.6854, lng: 76.1320 },
  'Jaisalmer': { lat: 26.9157, lng: 70.9083 },
  'Jodhpur': { lat: 26.2389, lng: 73.0243 },
  'Pushkar': { lat: 26.4897, lng: 74.5511 },
  'Mount Abu': { lat: 24.5926, lng: 74.7121 },
  'Khajuraho': { lat: 24.8318, lng: 79.9199 },
  'Amritsar': { lat: 31.6340, lng: 74.8723 },
  'Shirdi': { lat: 19.7645, lng: 74.4762 },
  'Mahabaleshwar': { lat: 17.9259, lng: 73.6577 },
  'Lonavala': { lat: 18.7557, lng: 73.4091 },
  'Hampi': { lat: 15.3350, lng: 76.4600 },
  'Gokarna': { lat: 14.5479, lng: 74.3188 },
  'Puri': { lat: 19.8135, lng: 85.8312 },
  'Kanyakumari': { lat: 8.0883, lng: 77.5385 },
  'Madurai': { lat: 9.9252, lng: 78.1198 },
  'Gulmarg': { lat: 34.0484, lng: 74.3805 },
  'Pahalgam': { lat: 34.0161, lng: 75.3150 },
  'Dharamshala': { lat: 32.2190, lng: 76.3234 },
  'Kasauli': { lat: 30.9013, lng: 76.9649 },
  'Goa': { lat: 15.2993, lng: 74.1240 },
  'Kerala': { lat: 10.8505, lng: 76.2711 },
};

const budgetTypes = ['hostel', 'inn', 'homestay', 'hotel'];
const midrangeTypes = ['hotel', 'resort', 'boutique', 'villa'];
const luxuryTypes = ['hotel', 'resort', 'villa', 'boutique'];

for (const config of citiesConfig) {
  const { city, state, areas } = config;
  const baseCoord = CITY_BASE_COORDINATES[city] || { lat: 28.6139, lng: 77.2090 };
  
  // Generate 30 properties per city
  for (let i = 1; i <= 30; i++) {
    let priceRange = 'MIDRANGE';
    if (i <= 10) priceRange = 'BUDGET';
    else if (i >= 21) priceRange = 'LUXURY';

    let propertyType = 'hotel';
    if (priceRange === 'BUDGET') {
      propertyType = budgetTypes[(i - 1) % budgetTypes.length];
    } else if (priceRange === 'MIDRANGE') {
      propertyType = midrangeTypes[(i - 11) % midrangeTypes.length];
    } else {
      propertyType = luxuryTypes[(i - 21) % luxuryTypes.length];
    }

    const templates = propertyTemplates[priceRange].types[propertyType];
    const nameBase = templates.names[(i - 1) % templates.names.length];
    const area = areas[(i - 1) % areas.length];

    const suffixes = [
      'Stays', 'Residency', 'Suites', 'Heights', 'Plaza', 'Palace', 'Haven', 'Retreat',
      'Comfort', 'Lodge', 'Boutique', 'Villas', 'Courtyard', 'Sanctuary', 'Grand', 'Royal',
      'Pavilion', 'View', 'Manor', 'Inn', 'Regency', 'Estates', 'Springs', 'Oasis',
      'Horizon', 'Heritage', 'Hub', 'Cottages', 'Park', 'Center'
    ];
    const suffix = suffixes[(i - 1) % suffixes.length];
    const name = `${area} ${nameBase} ${suffix}`;

    const description = templates.descriptions[(i - 1) % templates.descriptions.length];
    const images = imagePool[propertyType];
    const thumbnailImage = images[(i - 1) % images.length];
    const address = `${10 + i * 3}, ${area} Main Road, Block ${String.fromCharCode(65 + (i % 6))}`;
    
    // Calculate realistic offset coordinates (approx 1 - 8 km around area/city center)
    const latOffset = (((i * 17) % 20) - 10) * 0.004;
    const lngOffset = (((i * 23) % 20) - 10) * 0.004;
    const geoLat = parseFloat((baseCoord.lat + latOffset).toFixed(6));
    const geoLng = parseFloat((baseCoord.lng + lngOffset).toFixed(6));

    generatedProperties.push({
      name,
      description,
      address,
      city,
      state,
      propertyType,
      priceRange,
      geoLat,
      geoLng,
      thumbnailImage,
      amenities: templates.amenities
    });
  }
}

const allPropertiesToSeed = [...propertiesToSeed, ...generatedProperties];


async function main() {
  console.log('🌱 Seeding database with comprehensive list of hotels...');

  // ── Admin User ────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@staynest.com' },
    update: {},
    create: {
      name: 'StayNest Admin',
      email: 'admin@staynest.com',
      phone: '+910000000000',
      passwordHash: await bcrypt.hash('Admin@123', 12),
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log('✅ Admin:', admin.email);

  // ── Host User ─────────────────────────────────────────────
  const host = await prisma.user.upsert({
    where: { email: 'host@staynest.com' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'host@staynest.com',
      phone: '+919876543210',
      passwordHash: await bcrypt.hash('Host@123', 12),
      role: 'HOST',
      isVerified: true,
      hostBio: 'Passionate hotelier with 10+ years of experience. I love making guests feel at home!',
      avatar: 'https://i.pravatar.cc/150?img=47',
    },
  });
  console.log('✅ Host:', host.email);

  // ── Guest User ────────────────────────────────────────────
  const guest = await prisma.user.upsert({
    where: { email: 'guest@staynest.com' },
    update: {},
    create: {
      name: 'Rahul Kumar',
      email: 'guest@staynest.com',
      phone: '+919876543211',
      passwordHash: await bcrypt.hash('Guest@123', 12),
      role: 'GUEST',
      isVerified: true,
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
  });
  console.log('✅ Guest:', guest.email);

  // Price variants arrays for realistic distribution across price ranges (from ₹750 to ₹65,000)
  const budgetPricesRoom1 = [1200, 1500, 1800, 2000, 2200, 2500, 2800, 3100, 3400, 3800];
  const budgetPricesRoom2 = [750, 850, 950, 1100, 1300, 1450, 1600, 1750, 1900, 2100];

  const midrangePricesRoom1 = [3600, 4200, 4800, 5200, 5800, 6400, 6800, 7200, 7800, 8500];
  const midrangePricesRoom2 = [5500, 6200, 6900, 7500, 8400, 9200, 9900, 10800, 11800, 12800];

  const luxuryPricesRoom1 = [13500, 16000, 18500, 22000, 26000, 31000, 38000, 45000, 52000, 60000];
  const luxuryPricesRoom2 = [19500, 24000, 28500, 34000, 39000, 46000, 52000, 58000, 62000, 65000];

  // ── Properties ────────────────────────────────────────────
  let propIdx = 0;
  for (const prop of allPropertiesToSeed) {
    propIdx++;
    const { priceRange, ...propData } = prop;
    const propertyId = propData.name.replace(/\s+/g, '-').toLowerCase().substring(0, 36);

    const createdProperty = await prisma.property.upsert({
      where: { id: propertyId },
      update: {
        geoLat: propData.geoLat,
        geoLng: propData.geoLng,
        address: propData.address,
        city: propData.city,
      },
      create: {
        ...propData,
        id: propertyId,
        hostId: host.id,
        status: 'PUBLISHED',
        cancellationPolicy: priceRange === 'BUDGET' ? 'FREE' : priceRange === 'MIDRANGE' ? 'PARTIAL' : 'STRICT',
      },
    }).catch(async () => {
      return prisma.property.create({
        data: {
          ...propData,
          id: propertyId,
          hostId: host.id,
          status: 'PUBLISHED',
          cancellationPolicy: priceRange === 'BUDGET' ? 'FREE' : priceRange === 'MIDRANGE' ? 'PARTIAL' : 'STRICT',
        }
      });
    });

    console.log(`✅ Property: ${createdProperty.name} (${createdProperty.city})`);

    // Determine prices based on property index
    const variantIdx = propIdx % 10;
    let p1, p2;
    if (priceRange === 'BUDGET') {
      p1 = budgetPricesRoom1[variantIdx];
      p2 = budgetPricesRoom2[variantIdx];
    } else if (priceRange === 'MIDRANGE') {
      p1 = midrangePricesRoom1[variantIdx];
      p2 = midrangePricesRoom2[variantIdx];
    } else {
      p1 = luxuryPricesRoom1[variantIdx];
      p2 = luxuryPricesRoom2[variantIdx];
    }

    // Check if rooms already exist for this property
    const existingRooms = await prisma.room.findMany({
      where: { propertyId: createdProperty.id }
    });

    if (existingRooms.length > 0) {
      await prisma.room.update({
        where: { id: existingRooms[0].id },
        data: { pricePerNight: p1 },
      }).catch(() => {});
      if (existingRooms.length > 1) {
        await prisma.room.update({
          where: { id: existingRooms[1].id },
          data: { pricePerNight: p2 },
        }).catch(() => {});
      }
    } else {
      if (priceRange === 'BUDGET') {
        await prisma.room.createMany({
          data: [
            {
              propertyId: createdProperty.id,
              name: 'Eco Budget Room',
              description: 'Affordable, clean room with all essential amenities.',
              pricePerNight: p1,
              maxOccupancy: 2,
              bedConfig: '1 Double Bed',
              images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'],
              isInstantBook: true,
            },
            {
              propertyId: createdProperty.id,
              name: 'Standard Dorm Space',
              description: 'Single bunk bed in a clean shared dormitory space.',
              pricePerNight: p2,
              maxOccupancy: 1,
              bedConfig: '1 Single Bed',
              images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80'],
              isInstantBook: true,
            }
          ]
        });
      } else if (priceRange === 'MIDRANGE') {
        await prisma.room.createMany({
          data: [
            {
              propertyId: createdProperty.id,
              name: 'Executive Deluxe Room',
              description: 'Spacious room with a comfortable desk, high-speed WiFi, and complimentary breakfast.',
              pricePerNight: p1,
              maxOccupancy: 2,
              bedConfig: '1 Queen Bed',
              images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80'],
              isInstantBook: false,
            },
            {
              propertyId: createdProperty.id,
              name: 'Premium Family Suite',
              description: 'Generously sized suite with separate seating area and beautiful views.',
              pricePerNight: p2,
              maxOccupancy: 4,
              bedConfig: '2 Queen Beds',
              images: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80'],
              isInstantBook: true,
            }
          ]
        });
      } else if (priceRange === 'LUXURY') {
        await prisma.room.createMany({
          data: [
            {
              propertyId: createdProperty.id,
              name: 'Royal Heritage Grand Suite',
              description: 'Ultra-luxurious suite featuring handcrafted furniture, panoramic vistas, and premium butler service.',
              pricePerNight: p1,
              maxOccupancy: 3,
              bedConfig: '1 King Bed',
              images: ['https://images.unsplash.com/photo-1540541338537-0da3cb6b1413?w=800&q=80'],
              isInstantBook: true,
            },
            {
              propertyId: createdProperty.id,
              name: 'Imperial Presidential Sanctuary',
              description: 'The pinnacle of luxury. Private plunge pool, separate lounge, spa bathroom, and dining terrace.',
              pricePerNight: p2,
              maxOccupancy: 4,
              bedConfig: '2 King Beds',
              images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80'],
              isInstantBook: true,
            }
          ]
        });
      }
    }
  }

  console.log('✅ All rooms created and linked');
  console.log('\n🎉 Database seeded successfully with properties across all state capitals!');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
