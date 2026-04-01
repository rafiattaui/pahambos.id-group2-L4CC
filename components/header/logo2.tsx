import Image from 'next/image';

export default function Logo2() {
  return (
    <div className="px-4 py-4">
      <Image src="/logo.svg" alt="Logo" width={200} height={200} />
    </div>
  );
}
