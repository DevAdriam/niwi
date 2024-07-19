import Link from "next/link";
import { LightDarkToggle } from "../light-dark-toggler/light-dark-toggler";

export default function Navbar() {
  return (
    <header className="niwi-navbar">
      <nav className="nav">
        <section>
          <Link href="/" className="niwi-logo-text text-2xl">
            Niwi Starter
          </Link>
        </section>
        <section className="niwi-nav-right-container">
          <div id="niwi-navbar-right-portal">

          </div>
          <LightDarkToggle className="" />
        </section>
      </nav>
    </header>
  );
}
