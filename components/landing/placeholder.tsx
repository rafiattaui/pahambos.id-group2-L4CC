import Image from 'next/image';

export function Placeholder() {
  return (
    <Image
      src={'/Quiz placeholder.png'}
      alt="Quiz Placeholder"
      width={300}
      height={200}
      className='className="translate-x-8 translate-x-8 -translate-y-8 transform-gpu rounded-lg shadow-[-14px_14px_10px_rgba(0,0,0,0.28)] drop-shadow-white transition-all duration-500 ease-out hover:scale-105 hover:shadow-[-18px_18px_16px_rgba(0,0,0,0.32)]'
    />
  );
}
