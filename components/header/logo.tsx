import Image from "next/image";

export default function Logo() {
    return (
        <div className="px-4 py-4">
            <Image src="/logo.svg" alt="Logo" width={100} height={100} />
        </div>
    )
}