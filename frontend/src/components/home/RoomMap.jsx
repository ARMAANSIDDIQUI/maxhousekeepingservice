import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LuSparkles, LuArrowRight } from 'react-icons/lu';
import { apiRequest } from '../../api';
import { getServiceIcon } from '../../utils/iconHelper';

export default function RoomMap({ services = [] }) {
  const [activeRoom, setActiveRoom] = useState('living');
  const [liveServices, setLiveServices] = useState(services);

  useEffect(() => {
    if (services && services.length > 0) {
      setLiveServices(services);
    } else {
      apiRequest('/services')
        .then(res => {
          if (res && res.success !== false && res.services?.length > 0) {
            setLiveServices(res.services);
          }
        })
        .catch(() => {});
    }
  }, [services]);

  const findService = (slugMatch, catMatch) => {
    return liveServices.find(s =>
      s.slug === slugMatch ||
      s.category?.slug === catMatch ||
      s.categorySlug === catMatch ||
      s.category === catMatch
    ) || null;
  };

  const livingSvc = findService('sofa-carpet-cleaning', 'sofa-carpet-cleaning');
  const kitchenSvc = findService('kitchen-deep-cleaning', 'kitchen-cleaning');
  const bathroomSvc = findService('bathroom-deep-cleaning', 'bathroom-cleaning');
  const bedroomSvc = findService('full-home-deep-cleaning', 'home-deep-cleaning');

  const rooms = {
    living: {
      name: 'Living Room',
      categorySlug: 'sofa-carpet-cleaning',
      icon: livingSvc?.icon || 'armchair',
      service: livingSvc?.title || 'Sofa & Carpet Cleaning',
      slug: livingSvc?.slug || 'sofa-carpet-cleaning',
      priceText: livingSvc ? `From ₹${livingSvc.price.toLocaleString('en-IN')}` : 'From ₹299 / seat',
      description: livingSvc?.shortDescription || livingSvc?.description || 'Shampooing, dust mite vacuuming, and organic fabric stain removal.'
    },
    kitchen: {
      name: 'Kitchen & Chimney',
      categorySlug: 'kitchen-cleaning',
      icon: kitchenSvc?.icon || 'cookingpot',
      service: kitchenSvc?.title || 'Kitchen Deep Cleaning',
      slug: kitchenSvc?.slug || 'kitchen-deep-cleaning',
      priceText: kitchenSvc ? `From ₹${kitchenSvc.price.toLocaleString('en-IN')}` : 'From ₹1,499',
      description: kitchenSvc?.shortDescription || kitchenSvc?.description || 'Chimney degreasing, backsplash tile scrub, and appliance exterior detailing.'
    },
    bathroom: {
      name: 'Bathroom & Washroom',
      categorySlug: 'bathroom-cleaning',
      icon: bathroomSvc?.icon || 'bathtub',
      service: bathroomSvc?.title || 'Bathroom Deep Cleaning',
      slug: bathroomSvc?.slug || 'bathroom-deep-cleaning',
      priceText: bathroomSvc ? `From ₹${bathroomSvc.price.toLocaleString('en-IN')}` : 'From ₹799',
      description: bathroomSvc?.shortDescription || bathroomSvc?.description || 'Acid-free tile scaling removal, chrome tap polishing, and WC sanitisation.'
    },
    bedroom: {
      name: 'Master Bedroom',
      categorySlug: 'home-deep-cleaning',
      icon: bedroomSvc?.icon || 'houseline',
      service: bedroomSvc?.title || 'Full Home Deep Cleaning',
      slug: bedroomSvc?.slug || 'full-home-deep-cleaning',
      priceText: bedroomSvc ? `From ₹${bedroomSvc.price.toLocaleString('en-IN')}` : 'From ₹3,499 (1 BHK)',
      description: bedroomSvc?.shortDescription || bedroomSvc?.description || 'Floor scrubbing machine, mattress sanitisation, and glass track vacuuming.'
    }
  };

  const current = rooms[activeRoom] || rooms.living;

  return (
    <section className="py-16 bg-[#ECE5D8]/50 border-y border-[#E2D9C8]">
      <div className="container mx-auto px-4">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          {/* <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDEBE4] text-[#10231D] text-xs font-bold mb-3 border border-[#BED6CC]">
            <LuSparkles className="w-3.5 h-3.5 text-[#E9A23B]" />
            <span>INTERACTIVE HOME BLUEPRINT</span>
          </div> */}
          <h2 className="font-display font-black text-2xl sm:text-4xl text-[#10231D] tracking-tight">
            Explore Services by Room
          </h2>
          <p className="text-sm text-[#3D524A] mt-2">
            Click or hover over any area of the architectural floor plan to view specialized equipment and starting prices.
          </p>
        </div>

        {/* Blueprint Layout (Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          {/* SVG Floor Plan Container */}
          <div className="lg:col-span-7 bg-[#F4EFE6] p-6 rounded-2xl border-2 border-[#10231D] shadow-xl relative overflow-hidden">
            {/* <div className="absolute top-3 left-3 text-[10px] font-mono tracking-widest text-[#6B8077] uppercase">
              SCALE: 1:50 · RESIDENTIAL UNIT
            </div> */}

            <svg
              viewBox="0 0 600 400"
              className="w-full h-auto max-h-[360px] select-none"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(16, 35, 29, 0.05))' }}
            >
              {/* Outer Walls */}
              <rect x="20" y="20" width="560" height="360" fill="none" stroke="#10231D" strokeWidth="4" />

              {/* Room 1: Living Room (Top Left to Center) */}
              <g
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActiveRoom('living')}
                onClick={() => setActiveRoom('living')}
              >
                <rect
                  x="20" y="20" width="320" height="220"
                  fill={activeRoom === 'living' ? '#DDEBE4' : '#ECE5D8'}
                  stroke="#10231D" strokeWidth="2"
                  className="transition-colors duration-200"
                />
                {/* Sofa Illustration Outline */}
                <rect x="60" y="60" width="160" height="60" rx="8" fill="#F4EFE6" stroke="#3D524A" strokeWidth="1.5" />
                <rect x="50" y="70" width="20" height="40" rx="4" fill="#F4EFE6" stroke="#3D524A" strokeWidth="1" />
                <rect x="210" y="70" width="20" height="40" rx="4" fill="#F4EFE6" stroke="#3D524A" strokeWidth="1" />
                {/* Rug */}
                <rect x="80" y="140" width="120" height="70" stroke="#E9A23B" strokeWidth="1.5" strokeDasharray="4 2" fill="none" />
                <text x="140" y="180" textAnchor="middle" fill="#10231D" fontSize="13" fontWeight="bold">
                  LIVING ROOM
                </text>
              </g>

              {/* Room 2: Kitchen (Top Right) */}
              <g
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActiveRoom('kitchen')}
                onClick={() => setActiveRoom('kitchen')}
              >
                <rect
                  x="340" y="20" width="240" height="180"
                  fill={activeRoom === 'kitchen' ? '#DDEBE4' : '#ECE5D8'}
                  stroke="#10231D" strokeWidth="2"
                  className="transition-colors duration-200"
                />
                {/* Counter & Chimney */}
                <rect x="360" y="40" width="200" height="30" fill="#F4EFE6" stroke="#3D524A" strokeWidth="1" />
                <circle cx="420" cy="55" r="7" stroke="#C2512D" strokeWidth="1.5" fill="none" />
                <circle cx="480" cy="55" r="7" stroke="#C2512D" strokeWidth="1.5" fill="none" />
                <text x="460" y="120" textAnchor="middle" fill="#10231D" fontSize="13" fontWeight="bold">
                  KITCHEN & CHIMNEY
                </text>
              </g>

              {/* Room 3: Bathroom (Center Right) */}
              <g
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActiveRoom('bathroom')}
                onClick={() => setActiveRoom('bathroom')}
              >
                <rect
                  x="340" y="200" width="240" height="180"
                  fill={activeRoom === 'bathroom' ? '#DDEBE4' : '#ECE5D8'}
                  stroke="#10231D" strokeWidth="2"
                  className="transition-colors duration-200"
                />
                {/* Shower & Commode */}
                <rect x="500" y="220" width="60" height="60" fill="none" stroke="#3D524A" strokeWidth="1" />
                <circle cx="530" cy="250" r="10" stroke="#6B8077" strokeWidth="1" fill="#F4EFE6" />
                <text x="460" y="300" textAnchor="middle" fill="#10231D" fontSize="13" fontWeight="bold">
                  BATHROOM & TILES
                </text>
              </g>

              {/* Room 4: Master Bedroom (Bottom Left) */}
              <g
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActiveRoom('bedroom')}
                onClick={() => setActiveRoom('bedroom')}
              >
                <rect
                  x="20" y="240" width="320" height="140"
                  fill={activeRoom === 'bedroom' ? '#DDEBE4' : '#ECE5D8'}
                  stroke="#10231D" strokeWidth="2"
                  className="transition-colors duration-200"
                />
                {/* Double Bed */}
                <rect x="50" y="260" width="100" height="90" rx="4" fill="#F4EFE6" stroke="#3D524A" strokeWidth="1.5" />
                <rect x="60" y="265" width="35" height="20" rx="3" fill="#ECE5D8" />
                <rect x="105" y="265" width="35" height="20" rx="3" fill="#ECE5D8" />
                <text x="245" y="315" textAnchor="middle" fill="#10231D" fontSize="13" fontWeight="bold">
                  MASTER BEDROOM
                </text>
              </g>
            </svg>
          </div>

          {/* Room Details Active Card */}
          <div className="lg:col-span-5 bg-[#F4EFE6] p-6 sm:p-8 rounded-2xl border border-[#E2D9C8] shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono tracking-wider uppercase text-[#E9A23B] font-bold">
                  {current.name}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E9A23B]/15 text-[#10231D] font-bold text-xs">
                  {current.priceText}
                </span>
              </div>

              <h3 className="font-display font-black text-2xl text-[#10231D] mb-2 flex items-center gap-2.5">
                <span className="p-1.5 rounded-xl bg-[#ECE5D8] text-[#E9A23B] shrink-0 inline-flex shadow-xs border border-[#E2D9C8]">
                  {getServiceIcon(current.icon || current.categorySlug, 'w-5 h-5')}
                </span>
                <span>{current.service}</span>
              </h3>

              <p className="text-sm text-[#3D524A] leading-relaxed mb-6">
                {current.description}
              </p>

              {/* Highlights */}
              <div className="space-y-2 mb-6 text-xs text-[#10231D] font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E9A23B]" />
                  <span>Professional crew with industrial suction vacuums</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E9A23B]" />
                  <span>Non-toxic, odor-neutral Taski & Diversey solutions</span>
                </div>
              </div>
            </div>

            <Link
              to={`/services?category=${current.categorySlug}`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-sm transition-colors shadow"
            >
              <span>View {current.name} Packages</span>
              <LuArrowRight className="w-4 h-4 text-[#E9A23B]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
