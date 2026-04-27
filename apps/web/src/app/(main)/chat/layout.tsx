export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex h-[calc(100vh-var(--header-height,64px))]">{children}</div>;
}
