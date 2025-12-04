import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { MenuItem } from './types';
import { getImageUrl } from './imageMap';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestedItems?: MenuItem[];
}

interface AIWaiterProps {
  menuItems: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

// Webhook URL - используем прокси в dev режиме для обхода CORS
const getWebhookUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_WEBHOOK_URL;
  if (envUrl) return envUrl;
  
  // В режиме разработки используем прокси через vite
  if (import.meta.env.DEV) {
    return '/api/webhook/order-vangogi';
  }
  
  // В продакшене используем прямой URL
  return 'https://n8n.zakazhi.online/webhook/order-vangogi';
};

const WEBHOOK_URL = getWebhookUrl();

export function AIWaiter({ menuItems, onItemClick }: AIWaiterProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Здравствуйте! Я ваш AI-помощник в ресторане "Sapiens". Могу помочь с выбором блюд, ответить на вопросы о меню или порекомендовать что-то особенное. Чем могу быть полезен?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendToWebhook = async (chatInput: string): Promise<{ message: string; sessionId?: string } | null> => {
    try {
      console.log('Sending to webhook:', WEBHOOK_URL, { chatInput, sessionId });
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInput: chatInput.trim(),
          ...(sessionId && { sessionId }),
        }),
      });

      console.log('Webhook response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Webhook error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('Webhook response data:', data);
      
      return {
        message: data.message || data.text || data.response || data.output || JSON.stringify(data),
        sessionId: data.sessionId || sessionId || undefined,
      };
    } catch (error: any) {
      console.error('Webhook error:', error);
      
      // Проверяем тип ошибки для более информативного сообщения
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_NAME_NOT_RESOLVED') || error?.name === 'TypeError') {
        console.error('Network error - возможно, webhook URL недоступен или неправильный');
        throw new Error('NETWORK_ERROR');
      }
      
      return null;
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    // Отправляем запрос к webhook
    try {
      const webhookResponse = await sendToWebhook(currentInput);

      if (webhookResponse) {
        // Обновляем sessionId, если он пришел в ответе
        if (webhookResponse.sessionId) {
          setSessionId(webhookResponse.sessionId);
        }

        // Парсим ответ и пытаемся найти упоминания блюд
        const responseText = webhookResponse.message;
        const suggestedItems: MenuItem[] = [];
        
        // Ищем упоминания блюд в ответе
        menuItems.forEach(item => {
          if (responseText.toLowerCase().includes(item.name.toLowerCase())) {
            suggestedItems.push(item);
          }
        });

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'ai',
          timestamp: new Date(),
          suggestedItems: suggestedItems.length > 0 ? suggestedItems.slice(0, 4) : undefined,
        };

        setIsTyping(false);
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // Показываем сообщение об ошибке, если webhook недоступен
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Извините, в данный момент сервис временно недоступен. Пожалуйста, попробуйте позже или позовите официанта.',
          sender: 'ai',
          timestamp: new Date(),
        };

        setIsTyping(false);
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error: any) {
      // Обрабатываем сетевые ошибки
      let errorText = 'Извините, в данный момент сервис временно недоступен. Пожалуйста, попробуйте позже или позовите официанта.';
      
      if (error?.message === 'NETWORK_ERROR') {
        errorText = 'Не удалось подключиться к серверу. Пожалуйста, проверьте подключение к интернету или попробуйте позже.';
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: 'ai',
        timestamp: new Date(),
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const quickActions = [
    'Рекомендуйте блюдо',
    'Покажите хинкали',
    'Вегетарианские блюда',
    'Грузинская кухня',
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 py-4 h-[calc(100vh-140px)] flex flex-col" style={{ backgroundColor: '#eeecdd' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4"
      >
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="bg-gradient-to-r from-[#212529] to-[#212529] p-2.5 rounded-xl">
            <Bot className="w-5 h-5 text-[#eeecdd]" />
          </div>
          <h2 className="text-[#212529]">AI Официант</h2>
        </div>
        <p className="text-[#212529]/70 text-sm">
          Задавайте любые вопросы о меню и получайте персональные рекомендации
        </p>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-3 space-y-3 pr-1">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index === messages.length - 1 ? 0 : 0.05 }}
              className={`flex gap-2 ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.sender === 'ai'
                    ? 'bg-gradient-to-r from-[#212529] to-[#212529]'
                    : 'bg-[#eeecdd]'
                }`}
              >
                {message.sender === 'ai' ? (
                  <Bot className="w-4 h-4 text-[#eeecdd]" />
                ) : (
                  <User className="w-4 h-4 text-[#212529]/70" />
                )}
              </div>

              {/* Message bubble */}
              <div className="flex-1 max-w-[75%]">
                <div
                  className={`px-3 py-2.5 rounded-2xl ${
                    message.sender === 'ai'
                      ? 'bg-[#eeecdd] shadow-md'
                      : 'bg-gradient-to-r from-[#212529] to-[#212529] text-[#eeecdd]'
                  }`}
                >
                  <p className={`text-sm ${message.sender === 'ai' ? 'text-[#212529]/80' : ''}`}>
                    {message.text}
                  </p>
                </div>

                {/* Suggested Items */}
                {message.suggestedItems && message.suggestedItems.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.suggestedItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#eeecdd] rounded-lg overflow-hidden shadow-sm border border-[#212529]/10 cursor-pointer active:shadow-md transition-shadow"
                        onClick={() => onItemClick(item)}
                        whileTap={{ scale: 0.97 }}
                      >
                        <div className="flex gap-3 p-2">
                          <div className="relative w-16 h-16 overflow-hidden bg-gradient-to-br from-[#212529]/5 to-[#eeecdd] rounded-lg flex-shrink-0">
                            {getImageUrl(item.name) ? (
                              <ImageWithFallback
                                src={getImageUrl(item.name)}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-[#212529]/10 flex items-center justify-center">
                                  <Bot className="w-3 h-3 text-[#212529]/30" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[#212529] text-sm font-medium line-clamp-1 mb-1">
                              {item.name}
                            </h4>
                            <div className="px-2 py-1 rounded-full text-xs inline-block" style={{ backgroundColor: '#212529', color: '#eeecdd' }}>
                              <span style={{ color: '#eeecdd' }}>{item.price} ₽</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#212529] to-[#212529] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#eeecdd]" />
              </div>
              <div className="bg-[#eeecdd] shadow-md rounded-2xl px-3 py-2.5">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#212529] rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-[#212529] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-[#212529] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div className="mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {quickActions.map((action) => (
            <motion.button
              key={action}
              onClick={() => setInputText(action)}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 bg-[#eeecdd] border-2 border-[#212529]/20 text-[#212529] rounded-full active:bg-[#212529]/5 transition-colors whitespace-nowrap text-xs"
            >
              {action}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Напишите ваш вопрос..."
          className="flex-1 px-3 py-2.5 bg-[#eeecdd] border-2 border-[#212529]/20 rounded-xl focus:outline-none focus:border-[#212529] transition-colors text-sm"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          className="bg-gradient-to-r from-[#212529] to-[#212529] text-[#eeecdd] p-2.5 rounded-xl shadow-lg"
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}