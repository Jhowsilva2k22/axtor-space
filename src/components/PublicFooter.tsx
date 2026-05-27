import { Link } from "react-router-dom";

export const PublicFooter = () => (
  <footer className="mt-auto border-t border-gold/20 py-8 text-center">
    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
      © {new Date().getFullYear()} Axtor ·{" "}
      <Link to="/termos" className="transition-colors hover:text-primary">
        Termos
      </Link>{" "}
      ·{" "}
      <Link to="/privacidade" className="transition-colors hover:text-primary">
        Privacidade
      </Link>
    </p>
  </footer>
);
