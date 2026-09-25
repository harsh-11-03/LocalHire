import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";

export default function NotFound() {
  return (
    <section className="section-gap">
      <div className="page-shell">
        <EmptyState
          title="Page not found"
          text="The page you are looking for does not exist."
          action={
            <Link to="/" className="btn-primary">
              Go home
            </Link>
          }
        />
      </div>
    </section>
  );
}
