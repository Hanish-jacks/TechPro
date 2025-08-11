import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatDrawer() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ id: number; text: string; from: "me" | "other" }[]>([
    { id: 1, text: "Welcome to TechPro chat 👋", from: "other" },
  ]);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), text: text.trim(), from: "me" }]);
    setText("");
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 shadow-glow"
        aria-label="Open chat"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Messages</DrawerTitle>
          </DrawerHeader>

          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`px-3 py-2 rounded-md text-sm ${m.from === "me" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <DrawerFooter>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Write a message"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <Button onClick={send} aria-label="Send message">
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
