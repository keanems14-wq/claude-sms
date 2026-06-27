// server.js - Claude SMS Agent
const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const Anthropic = require('@anthropic-ai/sdk');
const { getThread, addMessage, clearThread } = require('./memory');

const app = express();
app.use(express.urlencoded({ extended: false }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_NUMBERS = (process.env.ALLOWED_NUMBERS || '').split(',').map(n => n.trim());

const SYSTEM_PROMPT = `You are a sharp, efficient AI assistant for a CRE professional in Milwaukee, WI. You help with deal analysis, lease abstracting, market research, tenant credit, LOI drafting, and financial modeling. You specialize in healthcare real estate, medical office buildings, and net lease in the Milwaukee/Wisconsin market. Be concise. This is SMS so keep responses under 1500 characters when possible. Use short bullet points for lists.`;

app.post('/sms', async (req, res) => {
    const twiml = new MessagingResponse();
    const from = req.body.From;
    const body = req.body.Body ? req.body.Body.trim() : '';

           if (ALLOWED_NUMBERS.length > 0 && !ALLOWED_NUMBERS.includes(from)) {
                 console.log('Blocked:', from);
                 res.type('text/xml');
                 res.send(twiml.toString());
                 return;
           }

           if (body.toLowerCase() === 'clear') {
                 clearThread(from);
                 twiml.message('Context cleared. Fresh start!');
                 res.type('text/xml');
                 res.send(twiml.toString());
                 return;
           }

           try {
                 addMessage(from, 'user', body);
                 const messages = getThread(from);

      const response = await client.messages.create({
              model: 'claude-opus-4-5',
              max_tokens: 1024,
              system: SYSTEM_PROMPT,
              messages: messages
      });

      const reply = response.content[0].text;
                 addMessage(from, 'assistant', reply);

      if (reply.length > 1550) {
              const chunks = reply.match(/.{1,1550}/g) || [];
              chunks.forEach(chunk => twiml.message(chunk));
      } else {
              twiml.message(reply);
      }
           } catch (err) {
                 console.error('Error:', err);
                 twiml.message('Sorry, something went wrong. Try again.');
           }

           res.type('text/xml');
    res.send(twiml.toString());
});

app.get('/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
