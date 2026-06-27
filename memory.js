// memory.js - Conversation memory with 2-hour expiry

const threads = new Map();
const EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

function getThread(phoneNumber) {
  const thread = threads.get(phoneNumber);
    if (!thread) return [];

        // Check if expired
          if (Date.now() - thread.lastActivity > EXPIRY_MS) {
              threads.delete(phoneNumber);
                  return [];
                    }

                        return thread.messages;
                        }

                        function addMessage(phoneNumber, role, content) {
                          let thread = threads.get(phoneNumber);

                              if (!thread || Date.now() - thread.lastActivity > EXPIRY_MS) {
                                  thread = { messages: [], lastActivity: Date.now() };
                                    }

                                        thread.messages.push({ role, content });
                                          thread.lastActivity = Date.now();
                                            threads.set(phoneNumber, thread);
                                            }

                                            function clearThread(phoneNumber) {
                                              threads.delete(phoneNumber);
                                              }

                                              module.exports = { getThread, addMessage, clearThread };
