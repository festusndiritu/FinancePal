"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatInputProps = {
  disabled?: boolean;
  onSend: (value: string) => Promise<void>;
};

export default function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = value.trim();
    if (!content) {
      return;
    }

    setValue("");
    await onSend(content);
  };

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder='Try: "Spent 500 on matatu"'
        disabled={disabled}
        className="h-12 bg-white"
      />
      <Button
        type="submit"
        disabled={disabled || !value.trim()}
        className="h-12 bg-teal-900 text-white hover:bg-teal-800"
      >
        <Send className="mr-2 h-4 w-4" />
        Send
      </Button>
    </form>
  );
}
