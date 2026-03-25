import Image from 'next/image';

export type CategoryItem = {
  name: string;
  image: string;
};

export const categories: CategoryItem[] = [
  { name: 'General', image: '/General.png' },
  { name: 'Geography', image: '/Geography.png' },
  { name: 'History', image: '/History.png' },
  { name: 'Language', image: '/Language.png' },
  { name: 'Mathematic', image: '/Mathematic.png' },
  { name: 'Science', image: '/Science.png' },
  { name: 'Technology', image: '/Technology.png' },
];

type CategoryProps = {
  name: string;
  image: string;
};

export default function Category({ name, image }: CategoryProps) {
  return (
    <div className="group relative h-56 w-full overflow-hidden rounded-2xl">
      <Image
        src={image}
        alt={name}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <p className="absolute bottom-4 left-4 text-lg font-semibold text-white">
        {name}
      </p>
    </div>
  );
}
