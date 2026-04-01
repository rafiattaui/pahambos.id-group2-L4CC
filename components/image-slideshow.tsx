'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';

const slides = [
  { src: '/slideshow.svg', alt: 'Slide 1' },
  { src: '/slideshow2.svg', alt: 'Slide 2' },
  { src: '/slideshow3.svg', alt: 'Slide 3' },
];

export default function ImageSlideshow() {
  return (
    <div className="relative h-full w-full">
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        speed={1000}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        loop={true}
        allowTouchMove={false}
        className="h-full w-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} style={{ position: 'relative' }}>
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover dark:brightness-[0.2] dark:grayscale"
              priority={index === 0}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
