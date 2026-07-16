import OpenAI from 'openai';

const apiKey = process.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('VITE_OPENAI_API_KEY is not set');
}

const openai = new OpenAI({
  apiKey,
});

export default openai;
