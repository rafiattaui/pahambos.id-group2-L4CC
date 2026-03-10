import Image from 'next/image';

export function Placeholder() {
  return (
    <Image
      src={'/Quiz placeholder.png'}
      alt="Quiz Placeholder"
      width={300}
      height={200}
    />
  );
}
