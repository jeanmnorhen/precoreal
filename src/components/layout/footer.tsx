export default function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} RealPrice Finder. All rights reserved.</p>
        <p className="mt-1">Your smart way to find local deals.</p>
      </div>
    </footer>
  );
}
