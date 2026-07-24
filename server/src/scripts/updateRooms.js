const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up active bookings, payments, and reviews to prevent constraint errors...');
  await prisma.payment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.room.deleteMany({});
  console.log('✅ Old rooms, bookings, reviews, and payments deleted.');

  console.log('📦 Fetching properties...');
  const properties = await prisma.property.findMany();
  console.log(`Found ${properties.length} properties.`);

  let updatedCount = 0;
  for (const property of properties) {
    // Determine category based on amenities or description or name
    let category = 'BUDGET';
    const name = property.name.toLowerCase();
    const desc = property.description.toLowerCase();
    
    if (
      name.includes('palace') ||
      name.includes('grand') ||
      name.includes('luxury') ||
      name.includes('resort') ||
      name.includes('villa') ||
      desc.includes('luxury') ||
      desc.includes('infinity pool') ||
      desc.includes('chef')
    ) {
      category = 'LUXURY';
    } else if (
      name.includes('deluxe') ||
      name.includes('executive') ||
      name.includes('boutique') ||
      name.includes('residency') ||
      desc.includes('business') ||
      desc.includes('modern')
    ) {
      category = 'MIDRANGE';
    }

    // Generate property-specific variance factor based on ID character codes
    const charSum = property.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const varianceFactor = 0.85 + (charSum % 41) * 0.01; // ranges from 0.85 to 1.25

    const roundedPrice = (basePrice) => {
      const varied = basePrice * varianceFactor;
      // Round to nearest 50 for clean pricing
      return Math.round(varied / 50) * 50;
    };

    let roomsData = [];
    if (category === 'BUDGET') {
      roomsData = [
        {
          name: 'Eco Single Bed Space',
          description: 'Affordable and clean single bed space, perfect for solo travelers on a budget.',
          pricePerNight: roundedPrice(450),
          maxOccupancy: 1,
          bedConfig: '1 Single Bed',
          images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80'],
          isInstantBook: true,
        },
        {
          name: 'Standard Twin Room',
          description: 'Comfortable room featuring twin beds and essential amenities.',
          pricePerNight: roundedPrice(750),
          maxOccupancy: 2,
          bedConfig: '2 Single Beds',
          images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80'],
          isInstantBook: true,
        },
        {
          name: 'Comfort Double Room',
          description: 'Cozy room with a double bed, air conditioning, and shared kitchen access.',
          pricePerNight: roundedPrice(950),
          maxOccupancy: 2,
          bedConfig: '1 Double Bed',
          images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'],
          isInstantBook: true,
        },
        {
          name: 'Family Quad Dorm',
          description: 'Spacious quad room suitable for families or small groups of friends.',
          pricePerNight: roundedPrice(1200),
          maxOccupancy: 4,
          bedConfig: '2 Bunk Beds',
          images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80'],
          isInstantBook: false,
        }
      ];
    } else if (category === 'MIDRANGE') {
      roomsData = [
        {
          name: 'Classic Deluxe Room',
          description: 'Elegant room with flat-screen TV, study desk, high-speed WiFi, and tea/coffee maker.',
          pricePerNight: roundedPrice(1100),
          maxOccupancy: 2,
          bedConfig: '1 Queen Bed',
          images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80'],
          isInstantBook: true,
        },
        {
          name: 'Executive Studio Room',
          description: 'Spacious studio with a work area, high-speed connectivity, and complimentary breakfast.',
          pricePerNight: roundedPrice(1600),
          maxOccupancy: 2,
          bedConfig: '1 Queen Bed',
          images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80'],
          isInstantBook: true,
        },
        {
          name: 'Premium Family Suite',
          description: 'Large suite featuring a separate seating area, master bed, and garden/city views.',
          pricePerNight: roundedPrice(2100),
          maxOccupancy: 4,
          bedConfig: '2 Double Beds',
          images: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80'],
          isInstantBook: false,
        },
        {
          name: 'Signature Balcony Suite',
          description: 'Top-tier mid-range suite featuring a private balcony with panoramic city views.',
          pricePerNight: roundedPrice(2600),
          maxOccupancy: 3,
          bedConfig: '1 King Bed',
          images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80'],
          isInstantBook: true,
        }
      ];
    } else {
      roomsData = [
        {
          name: 'Luxury Club Room',
          description: 'Plush room featuring designer furniture, marble bathroom, and access to the executive club lounge.',
          pricePerNight: roundedPrice(2200),
          maxOccupancy: 2,
          bedConfig: '1 King Bed',
          images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80'],
          isInstantBook: true,
        },
        {
          name: 'Royal Palace Suite',
          description: 'Experience royalty. Handcrafted furniture, local heritage artwork, and private balcony.',
          pricePerNight: roundedPrice(3500),
          maxOccupancy: 3,
          bedConfig: '1 King Bed',
          images: ['https://images.unsplash.com/photo-1540541338537-0da3cb6b1413?w=800&q=80'],
          isInstantBook: true,
        },
        {
          name: 'Grand Heritage Villa',
          description: 'Detached luxury villa with a private garden, outdoor sitout, and dedicated butler service.',
          pricePerNight: roundedPrice(4800),
          maxOccupancy: 4,
          bedConfig: '2 Queen Beds',
          images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80'],
          isInstantBook: true,
        },
        {
          name: 'Imperial Presidential Sanctuary',
          description: 'The ultimate luxury experience. Heated plunge pool, master lounge, walk-in spa bath, and scenic views.',
          pricePerNight: roundedPrice(6200),
          maxOccupancy: 4,
          bedConfig: '2 King Beds',
          images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80'],
          isInstantBook: true,
        }
      ];
    }

    // Insert rooms
    await prisma.room.createMany({
      data: roomsData.map(r => ({
        ...r,
        propertyId: property.id,
      }))
    });

    updatedCount++;
  }

  console.log(`🎉 Successfully generated 4 room types per property with varied pricing across all ${updatedCount} properties!`);
}

main()
  .catch(err => {
    console.error('❌ Room update script failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
