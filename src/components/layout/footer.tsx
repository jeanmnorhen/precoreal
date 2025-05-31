export default function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Preço Real. Todos os direitos reservados.</p>
        <p className="mt-1">Sua maneira inteligente de encontrar ofertas locais.</p>
      </div>
    </footer>
  );
}
