import { useSelector } from "react-redux";
import UrlForm from "../components/UrlForm";

export default function HomePage() {
  const { user } = useSelector((state) => state.auth);

  return (
    <main className="page-wrap">
      <section className="brand-panel mb-6 p-6">
        <div>
          <p className="page-kicker">Create</p>
          <h1 className="page-title mt-2">
            Short links ready for real campaigns.
          </h1>
          <p className="page-copy mt-3">
            Welcome back, {user?.name?.split(" ")[0] || "there"}. Create trackable links with optional passwords, expiry dates, tags, QR codes, and affiliate codes.
          </p>
        </div>
      </section>

      <UrlForm />
    </main>
  );
}
