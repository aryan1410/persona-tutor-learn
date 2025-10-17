import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  persona?: string;
}

export const useChat = (subject: string, conversationId: string | null, userId: string, userProfile: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string, persona: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare messages for AI (exclude IDs and timestamps)
      const aiMessages = messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: aiMessages,
          persona,
          subject,
          userId,
          userProfile,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Failed to get AI response: ${response.statusText}`);
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let assistantMessageId = (Date.now() + 1).toString();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg?.role === "assistant") {
                    return prev.slice(0, -1).concat({
                      ...lastMsg,
                      content: assistantContent,
                    });
                  }
                  return prev.concat({
                    id: assistantMessageId,
                    role: "assistant",
                    content: assistantContent,
                    timestamp: new Date(),
                    persona,
                  });
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Save messages to database if we have a conversation
      if (conversationId) {
        await supabase.from("messages").insert([
          {
            conversation_id: conversationId,
            role: "user",
            content: userMessage.content,
          },
          {
            conversation_id: conversationId,
            role: "assistant",
            content: assistantContent,
            persona,
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.concat({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }));
    } finally {
      setIsLoading(false);
    }
  }, [messages, subject, conversationId, userId, userProfile]);

  return { messages, isLoading, sendMessage };
};
