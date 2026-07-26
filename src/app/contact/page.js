import Image from "next/image";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="container">
      <h1>Contact Page</h1>
      <Link href="/">Go back to Home</Link>
      <Image src="/img/lagoon.jpg" alt="Lagoon" width={800} height={600} />
    </div>
  );
}
