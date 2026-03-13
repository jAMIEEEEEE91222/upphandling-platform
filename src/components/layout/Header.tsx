interface HeaderProps {
  userName: string;
}

export default function Header({ userName }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-end border-b border-border bg-white px-6">
      <span className="text-sm font-medium text-foreground">{userName}</span>
    </header>
  );
}
